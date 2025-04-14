export const generateInvoiceNumber = () => {
    // Generate a unique invoice number (e.g., INV-001, INV-002, etc.)
    return "INV-" + Math.floor(Math.random() * 1000);
}


export function generateLotAndBatchNumber(lastLotNumber) {
   
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0'); 
    const month = String(today.getMonth() + 1).padStart(2, '0'); 
    const year = today.getFullYear();
  
   
    const batchNumber = `batch-${day}/${month}/${year}`;
  
   
    lastLotNumber++; 
    const lotNumber = `lot-${String(lastLotNumber).padStart(3, '0')}`; 
  
    return { lotNumber, batchNumber, lastLotNumber }; 
  }