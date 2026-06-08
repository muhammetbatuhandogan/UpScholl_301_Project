export function onboardingFromApi(data) {
  return {
    step: Number(data.step) || 1,
    region: data.region || "",
    familySize: data.family_size || "1",
    hasChildren: data.has_children || "no",
    hasElderly: data.has_elderly || "no",
    completed: Boolean(data.completed)
  };
}

export function onboardingToApi(onboarding) {
  return {
    step: onboarding.step,
    region: onboarding.region,
    family_size: onboarding.familySize,
    has_children: onboarding.hasChildren,
    has_elderly: onboarding.hasElderly,
    completed: onboarding.completed
  };
}

export function bagItemsFromApi(apiItems, catalog) {
  const checkedMap = Object.fromEntries(
    (apiItems || []).map((item) => [item.item_key, item.checked])
  );
  return catalog.map((item) => ({
    ...item,
    checked: Boolean(checkedMap[item.id])
  }));
}

export function bagItemsToApi(items) {
  return items.map((item) => ({
    item_key: item.id,
    checked: Boolean(item.checked)
  }));
}

export function familyMembersFromApi(items) {
  return (items || []).map((member) => ({
    id: member.id,
    name: member.name,
    role: member.role || "Member",
    score: Number(member.score) || 0
  }));
}

export function sosContactsFromApi(contacts) {
  return (contacts || []).map((contact) => ({
    id: contact.id,
    name: contact.name,
    phone: contact.phone
  }));
}

export function sosContactsToApi(contacts) {
  return contacts.map((contact) => ({
    name: contact.name,
    phone: contact.phone
  }));
}
