const AWS = require("aws-sdk");
require("dotenv").config();
const fs = require("fs");

const S3 = new AWS.S3({
    apiVersion: "2006-03-01",
    signatureVersion: "v4",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: "ap-south-1",
  });


  const generateUniqueName = (length) => {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let uniqueName = "";
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * possible.length);
      uniqueName += possible[randomIndex];
    }
  
    return uniqueName;
  };
  

  const upload = async (file) => {
    try {
      const { tempFilePath, name: fileName, mimetype } = file;
  
      // Read the file into a buffer
      const fileData = fs.readFileSync(tempFilePath);
  
      // Generate a unique file name
      const uniqueFileName = `${generateUniqueName(4)}_${fileName}`;
  
      // S3 upload parameters
      const params = {
        Bucket: "document-management-walking",
        Key: uniqueFileName,
        Body: fileData,
        ContentType: mimetype,
        ContentDisposition: "inline",
      };
  
      // Upload to S3
      const { Location } = await S3.upload(params).promise();
      return Location;
    } catch (error) {
      throw new Error(`File upload failed: ${error.message}`);
    }
  };



  const uploadContentImage = async (file) => {
    try {
      // Debugging the file object before uploading
 
  
      const { data, name, mimetype } = file;
  
      // Ensure data is a Buffer and name is valid
      if (!data || !name) {
        throw new Error("Invalid file data or filename");
      }
  
      const params = {
        // Bucket: "tmabloggingbucket",
        Bucket: "document-management-walking",
        Key: name,
        Body: data, // Buffer from base64
        ContentType: mimetype,
      };
  
      // Debug log before uploading to check params
  
      const { Location } = await S3.upload(params).promise();
      return Location; // URL of the uploaded file
    } catch (error) {
      console.error(`File upload failed: ${error.message}`);
      throw error; // Re-throw the error for further handling
    }
  };

module.exports = { upload ,uploadContentImage};