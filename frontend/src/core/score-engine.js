export function calculateInitialScore({ region, familySize, hasChildren, hasElderly }) {
  let score = 20;
  if (region) score += 20;
  if (Number(familySize) >= 3) score += 15;
  if (hasChildren === "yes") score += 10;
  if (hasElderly === "yes") score += 10;
  return Math.min(score, 75);
}

export function calculateFamilyScore(members) {
  if (!members.length) return 0;
  const totalScore = members.reduce((sum, member) => sum + member.score, 0);
  return Math.round(totalScore / members.length);
}
