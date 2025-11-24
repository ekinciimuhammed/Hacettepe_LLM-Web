export const fetchMenuForDate = async (date = new Date()) => {
  try {
    // Format date for matching: DD.MM.YYYY
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const dateDot = `${day}.${month}.${year}`; // 24.11.2025
    
    // Target URL (Proxy path)
    const targetPath = "/bidbnew/grid.php?parameters=qbapuL6kmaScnHaup8DEm1B8maqturW8haidnI%2Bsq8F%2FgY1fiZWdnKShq8bTlaOZXq%2BmwWjLzJyPlpmcpbm1kNORopmYXI22tLzHXKmVnZykwafFhImVnZWipbq0f8qRnJ%2BioF6go7%2FOoplWqKSltLa805yVj5agnsGmkNORopmYXam2qbi%2Bo5mqlXRrinJdf1BQUFBXWXVMc39QUA%3D%3D";
    
    console.log("Fetching menu from:", targetPath);
    const response = await fetch(`/hacettepe-menu${targetPath}`);
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const htmlText = await response.text();
    console.log("Menu HTML received, length:", htmlText.length);
    
    // The structure is NOT a table. It looks like:
    // <hr>13.12.2025 Cumartesi <p>...</p><br> Kalori: 949<br> Menü: <br> Item 1<br> Item 2... <hr>
    
    // Find the start index of the date
    const dateIndex = htmlText.indexOf(dateDot);
    
    if (dateIndex === -1) {
      console.warn(`Date ${dateDot} not found in HTML.`);
      return null;
    }
    
    // Find the next <hr> after the date to define the end of this day's block
    const nextHrIndex = htmlText.indexOf("<hr>", dateIndex + 10);
    const endIndex = nextHrIndex !== -1 ? nextHrIndex : htmlText.length;
    
    // Extract the raw block for this day
    let rawBlock = htmlText.substring(dateIndex, endIndex);
    
    // Clean up the block
    // 1. Remove the date and day name (e.g. 13.12.2025 Cumartesi)
    // 2. Remove <p> tags and their content (often allergen links)
    // 3. Remove "Kalori: ..." line
    // 4. Remove "Menü:" label
    // 5. Replace <br> with newlines
    
    // Remove <p>...</p> tags (non-greedy)
    rawBlock = rawBlock.replace(/<p>.*?<\/p>/gs, "");
    
    // Remove "Kalori: ..."
    rawBlock = rawBlock.replace(/Kalori:.*?(<br>|$)/i, "");
    
    // Remove "Menü:"
    rawBlock = rawBlock.replace(/Menü:/i, "");
    
    // Replace <br> with newlines
    rawBlock = rawBlock.replace(/<br\s*\/?>/gi, "\n");
    
    // Remove HTML tags
    rawBlock = rawBlock.replace(/<[^>]*>/g, "");
    
    // Remove the date itself if it's still there at the start
    rawBlock = rawBlock.replace(dateDot, "");
    
    // Remove day names
    const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    days.forEach(d => rawBlock = rawBlock.replace(d, ''));
    
    // Clean up whitespace and empty lines
    const lines = rawBlock.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 2 && !line.startsWith('* Alerjen')); // Filter empty or junk lines
      
    return lines.join('\n');

  } catch (error) {
    console.error("Menu fetch error:", error);
    throw error;
  }
};
