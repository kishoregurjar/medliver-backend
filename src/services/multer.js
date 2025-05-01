const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { successRes } = require("./response");

// Utility to create multer configuration
const createMulter = (options = {}) => {
  const {
    folder = "uploads/miscellaneous", // default folder
    fileSize = 10000000, // default file size 10MB
    fileTypes = /jpeg|jpg|png|pdf|doc|docx|txt|xls|xlsx|csv|json|zip|rar/, // default file types
  } = options;

  // Ensure the upload directory exists
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  // Set storage engine
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // Ensure the folder exists before storing the file
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
      }
      cb(null, folder);
    },
    filename: (req, file, cb) => {
      // cb(null, `${Date.now()}-${file.originalname}`);
      const ext = file.mimetype.split("/")[1];
      const fileName = `${Date.now()}.${ext}`;
      cb(null, fileName);
    },
  });

  const mimeToExt = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/plain": "txt",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "text/csv": "csv",
    "application/json": "json",
    "application/zip": "zip",
    "application/x-rar-compressed": "rar",
    // Add other mime types if needed
  };

  const checkFileType = (file, cb) => {

    const mimetype = fileTypes.test(file.mimetype);

    if (mimetype) {
      const extname = mimeToExt[file.mimetype];
      if (extname) {
        file.originalname = `${file.originalname}.${extname}`;
        return cb(null, true);
      } else {
        const errorMessage = "File extension could not be determined.";
        return cb(new Error(errorMessage));
      }
    } else {
      const allowedExtensions = fileTypes
        .toString()
        .toUpperCase()
        .replace(/^\//, "") // Remove slash at the start
        .replace(/\/$/, "") // Remove slash at the end
        .replace(/\|/g, ", ");
      const errorMessage = `Only ${allowedExtensions} files are allowed.`;
      return cb(new Error(errorMessage));
    }
  };

  return multer({
    storage: storage,
    limits: { fileSize: fileSize },
    fileFilter: (req, file, cb) => {
      checkFileType(file, cb);
    },
  });
};

// Middleware for single file upload
const uploadSingleFile = (fieldName, options) => {
  const upload = createMulter(options).single(fieldName);
  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            const message = `File too large. Maximum size is ${options.fileSize / 1000000
              }MB.`;
            return successRes(res, 400, false, message);
          }
          return successRes(res, 400, false, err.message);
        } else {
          return successRes(res, 400, false, err.message);
        }
      }
      next();
    });
  };
};

const uploadMultipleFiles = (fieldName, maxCount, options) => {
  const upload = createMulter(options).array(fieldName, maxCount);
  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            const message = `File too large. Maximum size is ${options.fileSize / 1000000
              }MB.`;
            return successRes(res, 400, false, message);
          }
          if (err.code === "LIMIT_UNEXPECTED_FILE") {
            const message = `Too many files. Maximum allowed is ${maxCount}.`;
            return successRes(res, 400, false, message);
          }
          return successRes(res, 400, false, err.message);
        } else {
          return successRes(res, 400, false, err.message);
        }
      }
      next();
    });
  };
};

/* Admin Section */
module.exports.uploadInvoice = uploadSingleFile("files", {
  fileTypes: /jpeg|jpg|png/,
  fileSize: 3000000,
  folder: "uploads/adminProfile",
});

module.exports.uploadAdminProfile = uploadSingleFile("files", {
  fileTypes: /jpeg|jpg|png/,
  fileSize: 3000000,
  folder: "uploads/adminProfilePicture",
});
/* Delivery Partner Section */
module.exports.uploadDeliveryProfile = uploadSingleFile("image", {
  fileTypes: /jpeg|jpg|png/,
  fileSize: 3000000,
  folder: "uploads/deliveryPartnerProfile",
});

module.exports.uploadAdharcardImages = uploadMultipleFiles("files", 2, {
  fileTypes: /jpeg|jpg|png/,
  fileSize: 3000000,
  folder: "uploads/deliveryPartnerDocuments",
})

module.exports.uploadLicenceImage = uploadSingleFile("image", {
  fileTypes: /jpeg|jpg|png/,
  fileSize: 3000000,
  folder: "uploads/deliveryPartnerDocuments",
});


module.exports.uploadUserProfilePic = uploadSingleFile("image", {
  fileTypes: /jpeg|jpg|png/,
  fileSize: 3000000,
  folder: "uploads/userProfilePic",
});

module.exports.uploadLicenceImagePharmacy = uploadSingleFile("image", {
  fileTypes: /jpeg|jpg|png/,
  fileSize: 3000000,
  folder: "uploads/pharmacyDocuments",
});

module.exports.uploadMedicineImages = uploadMultipleFiles("images", 3, {
  fileTypes: /jpeg|jpg|png/,
  fileSize: 3000000,
  folder: "uploads/medicineImages",
});

module.exports.uploadTestCatgPic = uploadSingleFile("image", {
  fileTypes: /jpeg|jpg|png/,
  fileSize: 3000000,
  folder: "uploads/testCatg",
});

module.exports.uploadDoctoreCatgImg = uploadSingleFile("image", {
  fileTypes: /jpeg|jpg|png/,
  fileSize: 3000000,
  folder: "uploads/doctoreCategoryImage",
});

module.exports.uploadPrescription = uploadMultipleFiles("files", 5, {
  fileTypes: /jpeg|jpg|png/,
  fileSize: 3000000,
  folder: "uploads/prescription",
});


module.exports.uploadSingleFile = uploadSingleFile;
module.exports.uploadMultipleFiles = uploadMultipleFiles;
