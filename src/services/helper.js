const generateOTPNumber = (length) => {
  if (length <= 0) return 0;

  const min = Math.pow(10, length - 1);   // e.g., 1000 for 4 digits
  const max = Math.pow(10, length) - 1;   // e.g., 9999 for 4 digits

  return Math.floor(Math.random() * (max - min + 1)) + min;
};

module.exports = { generateOTPNumber };