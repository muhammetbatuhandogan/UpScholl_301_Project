"""Gemini (Google AI) integration for the assistant features.

The API key stays server-side (GEMINI_API_KEY env var). Clients send their
own context snapshot; we build a Turkish-language prompt and call the
Gemini REST API directly with httpx (no extra SDK dependency).
"""

import json
import logging
import os

import httpx

log = logging.getLogger("uvicorn.error")

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)
TIMEOUT_SECONDS = 30.0


def get_gemini_api_key() -> str:
    return os.getenv("GEMINI_API_KEY", "").strip()


def ai_configured() -> bool:
    return bool(get_gemini_api_key())


class AiServiceError(Exception):
    """Raised when the upstream LLM call fails."""


def _generate(prompt: str, *, json_mode: bool = False) -> str:
    if not ai_configured():
        raise AiServiceError(
            "AI servisi yapılandırılmamış (GEMINI_API_KEY eksik)."
        )

    generation_config: dict = {
        "temperature": 0.6,
        "maxOutputTokens": 4096,
        # Gemini 2.5 is a "thinking" model: without this it spends most of
        # the output budget on internal reasoning and the visible answer
        # gets truncated mid-sentence.
        "thinkingConfig": {"thinkingBudget": 0},
    }
    if json_mode:
        generation_config["responseMimeType"] = "application/json"

    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": generation_config,
    }

    try:
        response = httpx.post(
            GEMINI_URL,
            params={"key": get_gemini_api_key()},
            json=payload,
            timeout=TIMEOUT_SECONDS,
        )
    except httpx.HTTPError as exc:
        log.warning("gemini_request_failed: %s", exc)
        raise AiServiceError("AI servisine ulaşılamadı.") from exc

    if response.status_code == 429:
        raise AiServiceError(
            "AI servisi şu an yoğun (ücretsiz kota dakikalık sınırına takıldı). "
            "Lütfen bir dakika sonra tekrar dene."
        )
    if response.status_code != 200:
        log.warning("gemini_bad_status %s: %s", response.status_code, response.text[:300])
        raise AiServiceError("AI servisi hata döndürdü.")

    try:
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError, ValueError) as exc:
        log.warning("gemini_bad_payload: %s", response.text[:300])
        raise AiServiceError("AI yanıtı çözümlenemedi.") from exc


def _context_block(context: dict) -> str:
    return (
        "Kullanıcı bağlamı (JSON):\n"
        + json.dumps(context, ensure_ascii=False, indent=None)[:4000]
    )


def generate_insights(context: dict) -> dict:
    """Personalized prep plan + coaching based on the user's data."""
    prompt = (
        "Sen Türkiye'deki kullanıcılar için bir deprem hazırlık koçusun. "
        "Aşağıdaki kullanıcı verisine göre yanıt ver.\n\n"
        + _context_block(context)
        + "\n\nSadece şu şemada geçerli bir JSON döndür:\n"
        '{"coaching": "skorun mevcut durumunu 2-3 cümleyle yorumlayan, en zayıf '
        'alanı belirtip motive eden samimi bir metin", '
        '"plan": [{"title": "kısa eylem başlığı", "why": "tek cümlelik gerekçe", '
        '"priority": "yüksek|orta|düşük"}]}\n'
        "Plan 4-6 maddelik olsun, kullanıcının zayıf alanlarına (düşük skor "
        "bileşenleri, eksik çanta öğeleri, tamamlanmamış görevler) odaklan. "
        "Türkçe yaz. Tıbbi veya yapısal mühendislik iddiası yapma; resmi kaynak "
        "olarak AFAD'ı referans göster."
    )
    text = _generate(prompt, json_mode=True)
    try:
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`")
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end > start:
            cleaned = cleaned[start : end + 1]
        parsed = json.loads(cleaned)
        if not isinstance(parsed.get("plan"), list):
            raise ValueError("plan missing")
        return {
            "coaching": str(parsed.get("coaching", "")).strip(),
            "plan": parsed["plan"][:6],
        }
    except (ValueError, TypeError) as exc:
        log.warning("gemini_insights_parse_failed: %s", text[:300])
        raise AiServiceError("AI plan yanıtı çözümlenemedi.") from exc


def generate_chat_reply(messages: list[dict], context: dict) -> str:
    """Free-form Q&A grounded in earthquake preparedness."""
    history_lines = []
    for message in messages[-8:]:
        speaker = "Kullanıcı" if message.get("role") == "user" else "Asistan"
        history_lines.append(f"{speaker}: {str(message.get('content', ''))[:1000]}")
    history = "\n".join(history_lines)

    prompt = (
        "Sen 'Deprem Hazırlık' uygulamasının yardımsever asistanısın. "
        "Türkiye bağlamında deprem hazırlığı, afet bilinci ve uygulamanın "
        "özellikleri hakkında kısa ve net Türkçe yanıtlar verirsin. "
        "Konu dışı isteklerde kibarca deprem hazırlığına yönlendir. "
        "Acil durumlarda 112'yi aramasını söyle; resmi kaynak olarak AFAD'ı "
        "göster. Yanıtların 120 kelimeyi geçmesin, madde işareti kullanabilirsin.\n\n"
        + _context_block(context)
        + "\n\nKonuşma geçmişi:\n"
        + history
        + "\n\nAsistan:"
    )
    return _generate(prompt).strip()
