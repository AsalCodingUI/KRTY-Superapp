export const formatNumber = (val: string): string => {
  const num = val.replace(/,/g, "")
  if (num === "") return ""
  const parts = num.split(".")
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return parts.join(".")
}
