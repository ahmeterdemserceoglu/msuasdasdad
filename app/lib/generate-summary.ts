export function generateSummary(content: string, maxLength: number = 150): string {
  // Remove extra whitespaces and trim
  const cleanContent = content.trim().replace(/\s+/g, ' ');
  
  if (cleanContent.length <= maxLength) {
    return cleanContent;
  }
  
  // Try to cut at a sentence end
  const sentences = cleanContent.match(/[^.!?]+[.!?]+/g) || [];
  let summary = '';
  
  for (const sentence of sentences) {
    if (summary.length + sentence.length <= maxLength) {
      summary += sentence;
    } else {
      break;
    }
  }
  
  // If no complete sentence fits, cut at word boundary
  if (!summary) {
    const words = cleanContent.split(' ');
    for (const word of words) {
      if (summary.length + word.length + 1 <= maxLength - 3) { // -3 for "..."
        summary += (summary ? ' ' : '') + word;
      } else {
        break;
      }
    }
    summary += '...';
  }
  
  return summary;
}
