const LANG_KEY = "upscholl_lang";

let currentLang = localStorage.getItem(LANG_KEY) || "tr";

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  currentLang = lang === "en" ? "en" : "tr";
  localStorage.setItem(LANG_KEY, currentLang);
}

export function pick(obj) {
  if (obj && typeof obj === "object") return obj[currentLang] ?? obj.tr ?? "";
  return obj ?? "";
}

const STRINGS = {
  // App shell
  app_title: { tr: "Deprem Hazırlık", en: "Earthquake Prep" },
  app_subtitle: {
    tr: "Ailenizle birlikte depreme hazır olun.",
    en: "Get earthquake-ready with your family."
  },
  pill_checking: { tr: "Sunucu: kontrol ediliyor...", en: "Server: checking..." },
  pill_online: { tr: "Sunucu: bağlı", en: "Server: connected" },
  pill_offline: { tr: "Sunucu: çevrimdışı", en: "Server: offline" },
  wake_banner: {
    tr: "Sunucu uyandırılıyor, bu işlem ilk açılışta bir dakikaya kadar sürebilir...",
    en: "Waking up the server, this can take up to a minute on first load..."
  },
  server_unreachable: {
    tr: "Sunucuya ulaşılamadı. Lütfen sayfayı yenileyin.",
    en: "Could not reach the server. Please refresh the page."
  },

  // Navigation
  nav_dashboard: { tr: "Panel", en: "Dashboard" },
  nav_onboarding: { tr: "Başlangıç", en: "Onboarding" },
  nav_bag: { tr: "Çanta", en: "Bag" },
  nav_family: { tr: "Aile", en: "Family" },
  nav_emergency: { tr: "Acil Durum", en: "Emergency" },

  // Auth gate
  auth_gate_msg: {
    tr: 'Bu modül giriş gerektirir. Demo bilgileri veya OTP ile giriş yapmak için <a href="#dashboard">Panel</a> sekmesini açın.',
    en: 'This module requires login. Open the <a href="#dashboard">Dashboard</a> tab to sign in with demo credentials or OTP.'
  },

  // Dashboard: auth
  login_demo: { tr: "Giriş (Demo)", en: "Login (Demo)" },
  username: { tr: "Kullanıcı adı", en: "Username" },
  password: { tr: "Şifre", en: "Password" },
  login: { tr: "Giriş Yap", en: "Login" },
  logout: { tr: "Çıkış Yap", en: "Logout" },
  auth_logged_in: { tr: "Durum: giriş yapıldı —", en: "Status: logged in as" },
  auth_logged_out: { tr: "Durum: çıkış yapıldı", en: "Status: logged out" },
  otp_login: { tr: "OTP ile Giriş", en: "OTP Login" },
  phone_label: { tr: "Telefon (E.164)", en: "Phone (E.164)" },
  send_otp: { tr: "OTP Gönder", en: "Send OTP" },
  code_label: { tr: "6 haneli kod", en: "6-digit code" },
  verify_otp: { tr: "OTP Doğrula", en: "Verify OTP" },
  username_password_required: {
    tr: "Kullanıcı adı ve şifre zorunludur.",
    en: "Username and password are required."
  },
  login_success: { tr: "Giriş başarılı.", en: "Login successful." },
  login_failed: { tr: "Giriş başarısız", en: "Login failed" },
  logged_in_sync_failed: {
    tr: "Giriş yapıldı ama veri senkronu başarısız",
    en: "Logged in, but sync failed"
  },
  otp_sent: { tr: "OTP gönderildi.", en: "OTP sent." },
  otp_sent_sms: { tr: "OTP gönderildi. SMS'i kontrol edin.", en: "OTP sent. Check SMS." },
  otp_debug: { tr: "Debug OTP (sadece geliştirme)", en: "Debug OTP (dev only)" },
  otp_request_failed: { tr: "OTP isteği başarısız", en: "OTP request failed" },
  otp_verify_failed: { tr: "OTP doğrulama başarısız", en: "OTP verify failed" },
  otp_login_success: { tr: "OTP ile giriş başarılı.", en: "OTP login successful." },
  logged_out: { tr: "Çıkış yapıldı.", en: "Logged out." },

  // Dashboard: tasks
  create_task: { tr: "Görev Oluştur", en: "Create Task" },
  creating: { tr: "Oluşturuluyor...", en: "Creating..." },
  task_title: { tr: "Görev başlığı", en: "Task title" },
  status_label: { tr: "Durum", en: "Status" },
  status_todo: { tr: "yapılacak", en: "todo" },
  "status_in-progress": { tr: "devam ediyor", en: "in-progress" },
  status_done: { tr: "tamamlandı", en: "done" },
  summary: { tr: "Özet", en: "Summary" },
  readiness_score: { tr: "Hazırlık skoru", en: "Readiness score" },
  total_tasks: { tr: "Toplam görev", en: "Total tasks" },
  last_updated: { tr: "Son güncelleme", en: "Last updated" },
  open_health: { tr: "/health adresini aç", en: "Open /health" },
  tasks_heading: { tr: "Görevler", en: "Tasks" },
  loading_tasks: { tr: "Görevler yükleniyor...", en: "Loading tasks..." },
  no_tasks: {
    tr: "Henüz görev yok. İlk görevinizi oluşturun.",
    en: "No tasks yet. Create your first task."
  },
  login_required_tasks: {
    tr: "Görevleri görmek için giriş yapın.",
    en: "Login required to view tasks."
  },
  failed_load_tasks: { tr: "Görevler yüklenemedi", en: "Failed to load tasks" },
  failed_sync: { tr: "Veri senkronu başarısız", en: "Failed to sync data" },
  please_login: { tr: "Lütfen önce giriş yapın.", en: "Please login first." },
  task_title_required: { tr: "Görev başlığı zorunludur.", en: "Task title is required." },
  task_created: { tr: "Görev oluşturuldu.", en: "Task created." },
  create_failed: { tr: "Oluşturma başarısız", en: "Create failed" },
  delete: { tr: "Sil", en: "Delete" },
  confirm_delete_task: { tr: "Bu görev silinsin mi?", en: "Delete this task?" },
  task_deleted: { tr: "Görev silindi.", en: "Task deleted." },
  delete_failed: { tr: "Silme başarısız", en: "Delete failed" },
  status_updated: { tr: "Durum güncellendi.", en: "Status updated." },
  update_failed: { tr: "Güncelleme başarısız", en: "Update failed" },
  done_revert: {
    tr: "Tamamlanan görevler geri alınamaz.",
    en: "Completed tasks cannot be reverted."
  },

  // Bag
  bag_title: { tr: "Acil Durum Çantası", en: "Emergency Bag" },
  bag_subtitle: {
    tr: "Kontrol listesi sunucu ile senkronize.",
    en: "Checklist synced with backend API."
  },
  completed_label: { tr: "tamamlandı", en: "completed" },
  bag_sync_failed: { tr: "Çanta senkronu başarısız", en: "Bag sync failed" },

  // Emergency
  em_guide: { tr: "Acil Durum Rehberi", en: "Emergency Guide" },
  em_guide_sub: {
    tr: "Çevrimdışı çalışan acil durum talimatları (yerleşik içerik).",
    en: "Offline-first emergency instructions (bundled content)."
  },
  g_during: { tr: "Deprem Anında", en: "During Quake" },
  g_after: { tr: "Deprem Sonrası", en: "After Quake" },
  g_72h: { tr: "İlk 72 Saat", en: "First 72h" },
  g_trapped: { tr: "Enkaz Altında", en: "If Trapped" },
  sos_contacts: { tr: "SOS Kişileri", en: "SOS Contacts" },
  contact_name: { tr: "Kişi adı", en: "Contact name" },
  phone: { tr: "Telefon", en: "Phone" },
  save_contacts: { tr: "Kişileri Kaydet", en: "Save Contacts" },
  max_contacts: { tr: "En fazla 3 kişi eklenebilir", en: "Max 3 contacts reached" },
  max_contacts_toast: {
    tr: "En fazla 3 SOS kişisi eklenebilir.",
    en: "Maximum 3 SOS contacts allowed."
  },
  sos_login_hint: {
    tr: 'SOS kişilerini yönetmek ve uyarı göndermek için giriş gerekir. <a href="#dashboard">Panel</a>',
    en: 'Login required to manage SOS contacts and send alerts. <a href="#dashboard">Dashboard</a>'
  },
  last_sos: { tr: "Son SOS", en: "Last SOS" },
  send_sos: { tr: "SOS Gönder", en: "Send SOS" },
  contact_list: { tr: "Kişi Listesi", en: "Contact List" },
  no_contacts: { tr: "Henüz SOS kişisi eklenmedi.", en: "No SOS contacts added yet." },
  remove: { tr: "Kaldır", en: "Remove" },
  name_phone_required: {
    tr: "Ad ve telefon zorunludur.",
    en: "Name and phone are required."
  },
  contacts_saved: { tr: "SOS kişileri kaydedildi.", en: "SOS contacts saved." },
  save_failed: { tr: "Kaydetme başarısız", en: "Save failed" },
  contact_removed: { tr: "SOS kişisi kaldırıldı.", en: "SOS contact removed." },
  remove_failed: { tr: "Kaldırma başarısız", en: "Remove failed" },
  add_contact_first: {
    tr: "Önce en az bir SOS kişisi ekleyin.",
    en: "Add at least one SOS contact first."
  },
  confirm_sos: {
    tr: "Kişilerinize SOS uyarısı gönderilsin mi?",
    en: "Send SOS alert to your contacts?"
  },
  sos_sent: { tr: "SOS gönderildi (durum:", en: "SOS sent (status:" },
  sos_failed: { tr: "SOS başarısız", en: "SOS failed" },

  // Family
  household: { tr: "Hane Üyeleri", en: "Household Members" },
  household_sub: {
    tr: "Yerel liste (en fazla 5) sunucu ile senkronize.",
    en: "Local roster (max 5) synced with backend."
  },
  member_name: { tr: "Üye adı", en: "Member name" },
  role: { tr: "Rol", en: "Role" },
  role_Parent: { tr: "Ebeveyn", en: "Parent" },
  role_Child: { tr: "Çocuk", en: "Child" },
  role_Elderly: { tr: "Yaşlı", en: "Elderly" },
  role_Relative: { tr: "Akraba", en: "Relative" },
  role_Member: { tr: "Üye", en: "Member" },
  prep_score: { tr: "Hazırlık skoru (0-100)", en: "Preparedness score (0-100)" },
  add_member: { tr: "Üye Ekle", en: "Add Member" },
  max_members: { tr: "En fazla 5 üye eklenebilir", en: "Max 5 members reached" },
  max_members_toast: {
    tr: "En fazla 5 aile üyesi eklenebilir.",
    en: "Maximum 5 family members allowed."
  },
  family_summary: { tr: "Aile Özeti", en: "Family Summary" },
  members_label: { tr: "Üyeler", en: "Members" },
  family_score: { tr: "Aile skoru", en: "Family score" },
  group_label: { tr: "Grup", en: "Group" },
  group_active: { tr: "Aktif", en: "Active" },
  group_not_joined: { tr: "Katılınmadı", en: "Not joined" },
  family_group: { tr: "Aile Grubu", en: "Family Group" },
  invite_code: { tr: "Davet kodu", en: "Invite code" },
  leader: { tr: "(lider)", en: "(leader)" },
  weakest: { tr: "En zayıf halka", en: "Weakest link" },
  leave_group: { tr: "Gruptan Ayrıl", en: "Leave Group" },
  create_group: { tr: "Grup Oluştur", en: "Create Group" },
  join_hint: {
    tr: "Bir grup oluşturun veya 6 haneli davet koduyla katılın.",
    en: "Create a group or join with a 6-digit invite code."
  },
  join_group: { tr: "Gruba Katıl", en: "Join Group" },
  no_members: {
    tr: "Henüz hane üyesi eklenmedi.",
    en: "No household members added yet."
  },
  member_name_required: { tr: "Üye adı zorunludur.", en: "Member name is required." },
  score_range: {
    tr: "Skor 0 ile 100 arasında olmalıdır.",
    en: "Score must be between 0 and 100."
  },
  member_added: { tr: "Aile üyesi eklendi.", en: "Family member added." },
  add_failed: { tr: "Ekleme başarısız", en: "Add failed" },
  member_removed: { tr: "Aile üyesi kaldırıldı.", en: "Family member removed." },
  group_created: { tr: "Aile grubu oluşturuldu.", en: "Family group created." },
  create_group_failed: { tr: "Grup oluşturulamadı", en: "Create group failed" },
  joined_group: { tr: "Aile grubuna katıldınız.", en: "Joined family group." },
  join_failed: { tr: "Katılma başarısız", en: "Join failed" },
  left_group: { tr: "Aile grubundan ayrıldınız.", en: "Left family group." },
  leave_failed: { tr: "Ayrılma başarısız", en: "Leave failed" },

  // Onboarding
  onb_title: { tr: "Başlangıç Modülü", en: "Onboarding Module" },
  step: { tr: "Adım", en: "Step" },
  completed_tag: { tr: "Tamamlandı", en: "Completed" },
  synced: { tr: "sunucu ile senkronize", en: "synced with backend" },
  region_label: { tr: "Bölge / Şehir", en: "Region / City" },
  region_ph: { tr: "örn. İstanbul", en: "e.g. Istanbul" },
  region_hint: {
    tr: "Hazırlık önerilerini kişiselleştirmek için yaşadığınız bölgeyi seçin.",
    en: "Select your main living region to personalize preparedness context."
  },
  family_size: { tr: "Aile büyüklüğü", en: "Family size" },
  children_q: { tr: "Ailede çocuk var mı?", en: "Children in family?" },
  elderly_q: { tr: "Yaşlı veya engelli üye var mı?", en: "Elderly or disabled member?" },
  yes: { tr: "Evet", en: "Yes" },
  no: { tr: "Hayır", en: "No" },
  est_score: {
    tr: "Tahmini başlangıç hazırlık skoru",
    en: "Estimated initial preparedness score"
  },
  region_sum: { tr: "Bölge", en: "Region" },
  children_sum: { tr: "Çocuk", en: "Children" },
  elderly_sum: { tr: "Yaşlı/Engelli", en: "Elderly/Disabled" },
  region_required: { tr: "Bölge zorunludur.", en: "Region is required." },
  back: { tr: "Geri", en: "Back" },
  continue: { tr: "Devam", en: "Continue" },
  finish: { tr: "Bitir", en: "Finish" },
  onb_saved: {
    tr: "Başlangıç tamamlandı ve kaydedildi.",
    en: "Onboarding completed and saved."
  }
};

export function t(key) {
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[currentLang] ?? entry.tr ?? key;
}
