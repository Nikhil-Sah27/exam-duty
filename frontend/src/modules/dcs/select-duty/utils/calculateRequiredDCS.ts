/**
 * Spec-locked DCS sizing formula. Frontend mirror of the backend util in
 * `backend/modules/dcs/dcsCalculation.utils.js` — keep them in sync so the
 * preview shown to the DCS user always matches what the server computed.
 *
 *   N = ceil(totalStudents / 300)
 */
export function calculateRequiredDCS(totalStudents: number): number {
  const n = Number(totalStudents) || 0;
  if (n <= 0) return 0;
  return Math.ceil(n / 300);
}
