// import {v2 as cloudinary} from "cloudinary"
// import fs from "fs"


// cloudinary.config({ 
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
//   api_key: process.env.CLOUDINARY_API_KEY, 
//   api_secret: process.env.CLOUDINARY_API_SECRET 
// });

// const uploadOnCloudinary = async (localFilePath) => {
//     try {
//         if (!localFilePath) return null
//         //upload the file on cloudinary
//         const response = await cloudinary.uploader.upload(localFilePath, {
//             resource_type: "auto"
//         })
//         // file has been uploaded successfull
//         //console.log("file is uploaded on cloudinary ", response.url);
       
//         return response;

//     } catch (error) {
//         fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
//         return null;
//     }
// }



// export {uploadOnCloudinary}


// import { v2 as cloudinary } from "cloudinary";
// import fs from "fs";

// cloudinary.config({ 
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
//     api_key: process.env.CLOUDINARY_API_KEY, 
//     api_secret: process.env.CLOUDINARY_API_SECRET 
// });

// const uploadOnCloudinary = async (localFilePath) => {
//     try {
//         if (!localFilePath) {
//             throw new Error("File path not found");
//         }

//         // Upload the file on Cloudinary
//         const response = await cloudinary.uploader.upload(localFilePath, {
//             resource_type: "auto"
//         });

//         return response;  // File uploaded successfully
//     } catch (error) {
//         console.error("Error during Cloudinary upload:", error);

//         // Attempt to delete the local file
//         try {
//             await fs.promises.unlink(localFilePath); // Asynchronous unlink
//         } catch (unlinkError) {
//             console.error("Error deleting the local file:", unlinkError);
//         }

//         return null;  // Return null to indicate failure
//     }
// };

// export { uploadOnCloudinary };


import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            throw new Error("File path not found");
        }

        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

      

        return response; // Return the response after successful upload
    } catch (error) {
        console.error("Error during Cloudinary upload:", error);

        // Check if the file exists before attempting to delete it
        if (fs.existsSync(localFilePath)) {
            try {
                await fs.promises.unlink(localFilePath); // Asynchronous file deletion
            } catch (unlinkError) {
                console.error("Error deleting the local file:", unlinkError);
            }
        } else {
            console.error("File not found:", localFilePath);
        }

        return null; // Return null to indicate failure
    }
};

export { uploadOnCloudinary };
