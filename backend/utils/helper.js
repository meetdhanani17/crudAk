const { createCanvas, loadImage } = require("canvas");
var sanitizer = require("../node_modules/sanitizer");
const axios = require('axios');
const fs = require('fs');
const archiver = require('archiver');
var path = require('path');
const { fromBuffer } = require("pdf2pic");
const pdf = require("pdf-page-counter");
// const imageThumbnail = require('image-thumbnail');
const sharp = require('sharp');
const gm = require('gm');
const fileUpload = require('./upload');
const CONSTANTS = require('../config/constant');
const momentTz = require("moment-timezone")

// var Calipers = require('calipers')('png', 'jpeg', 'pdf');
const mongoose = require('mongoose');
var pdf2img = require('pdf2img');
const { PDFDocument, PDFPage, rgb } = require("pdf-lib");
const ObjectId = mongoose.Types.ObjectId;

var Helper = function () {};

Helper.prototype.xss_clean = function (vals) {
    
    if(typeof vals == "object" && typeof vals.length != "undefined" && vals.length > 0){
        for(x in vals){
            vals[x] = sanitizer.sanitize(vals[x]);
        }
    }else if(typeof vals == "object" && typeof vals.length == "undefined" && Object.keys(vals).length > 0){
        let keys = Object.keys(vals)
        for(x in keys){
            vals[keys[x]] = sanitizer.sanitize(vals[keys[x]]);
        }
    }else{
        vals = sanitizer.sanitize(vals);
    }
    return vals
}
Helper.prototype.random_number = function(otpLength) {
    var digits = '0123456789';
    var otp = '';
    for(let i=1; i<=otpLength; i++){
        var index = Math.floor(Math.random()*(digits.length));
        otp = otp + digits[index];
    }
    return otp;
}

Helper.prototype.notification = async function(notificationReq){
        const api_url = process.env.NOTIFICATION_CLIENT;
    
        var notificationObject = {}
        if(notificationReq.emailData){
            notificationObject.email = notificationReq.emailData
        }
        if(notificationReq.smsData){
            notificationObject.sms = notificationReq.smsData
        }

        if(notificationReq.push){
            notificationObject.push = notificationReq.push
        }

        
        
        const body = notificationObject
        // console.log(body)
        try {
            const response = await axios.post(api_url,body);
            return response.data;
        } catch (error) {
            console.log(error,"Notification error");
            return {
                data: {},
                message: 'Failed to send notification due to some technical issue.',
                status: false
            }
        }
      
}

const imageSizeByBuffer = async (buffers) => {
    return new Promise((resolve, reject) => {
        sharp(buffers).metadata((err, metadata) => {
            if(err) reject(err);
            resolve(metadata);
        })
    })
}

Helper.prototype.imageSizeByBuffer = async (buffers) => {
    return new Promise((resolve, reject) => {
        sharp(buffers).metadata((err, metadata) => {
            if(err) reject(err);
            resolve(metadata);
        })
    })
}

Helper.prototype.generateUID = function() {
    var firstPart = (Math.random() * 46656) | 0;
    var secondPart = (Math.random() * 46656) | 0;
    firstPart = ("000" + firstPart.toString(36)).slice(-3);
    secondPart = ("000" + secondPart.toString(36)).slice(-3);
    return firstPart + secondPart;
}

Helper.prototype.getOnlyDate = function(t = new Date(), timeZone=""){
    if(timeZone){
        let hh = timeZone.split(":")?.[0];
        hh = hh ? Number(hh) : 0;
        let mm = timeZone.split(":")?.[1];
        mm = mm ? Number(mm) : 0;
        t = (new Date(momentTz(t).add(hh, 'hours').add(mm,'minutes').format("YYYY-MM-DD")))
    }else{
        t = (new Date(momentTz(t).format("YYYY-MM-DD")))
    }
    
    const todayDateString = `${t.getFullYear()}-${('0'+(t.getMonth()+1)).slice(-2)}-${('0'+t.getDate()).slice(-2)}`;
    return new Date(t);
}

const pdfToPngLocal = async (input, setOptionsPDFtoPNG) => {
    return new Promise((resolve, reject) => {
        pdf2img.setOptions(setOptionsPDFtoPNG);        
        pdf2img.convert(input, function(err, info) {
            if (err){
                console.log(err, "err err err - pdfToPngLocal")
                reject(err)
            }else{
                resolve(info);
            }
            
        });
    })
}

Helper.prototype.createPlanPdf = async (request, response, detailsData) => {
    let planId = detailsData.plan_id ? detailsData.plan_id :  ObjectId();
    let projectId = detailsData.projectId;
    
    let planArrays = [];
    const Key = detailsData.file.split(`.amazonaws.com/`).pop();
    const fileName = path.basename(Key);
    try {
        
        let fileDataStr = await fileUpload.downloadFile(Key);
        const fileData = await axios.post(process.env.PDFCONVERTER_CLIENT,{
            "key":Key,
            "upload_path":`project/${projectId}/plan/${planId}/convert/${fileName.split(".")?.[0]}`
        });

        const pdf = await PDFDocument.load(fileDataStr.Body);
        const totalPageNumber = pdf.getPageCount();
        let originalFileArray = [];
        for(let i = 0; i< totalPageNumber; i++){
            const pdfDoc = await PDFDocument.create();
            const [firstDonorPage] = await pdfDoc.copyPages(pdf, [i])
            pdfDoc.addPage(firstDonorPage)
            let pdfPageStr = await pdfDoc.save();
            let buffer = Buffer.from( new Uint8Array(pdfPageStr) );
            let ofname = "";
            if(totalPageNumber == 1){
                ofname = `project/${(projectId ? projectId+"/":"")}plan/${planId}/${fileName}`
            }else{
                ofname = `project/${(projectId ? projectId+"/":"")}plan/${planId}/${fileName.replace(".pdf","")}_page_${i+1}.pdf`
            }
            let fileRs = await fileUpload.bufferFile({
                body: buffer,
                file_name: ofname,
                planId: planId,
            });
            originalFileArray.push(fileRs)
        }
        // let sizeImg = await imageSizeByBuffer(fileData.Body);
        
        // console.log(sizeImg, "sizeImg")
        
        // sudo npm i pdf2img
        // sudo apt-get install imagemagick --fix-missing
        // console.log(Key, "Key", process.env.BUCKET_NAME)
    
    
        if (fileData && fileData.data && fileData.data.data && Array.isArray(fileData.data.data.urls) && fileData.data.data.urls.length > 0) {
            // Calipers
            // let tempFile = `${request.__dirname}/assets/plan_pdf/temp-${fileName}`;
            // fs.writeFileSync(tempFile, fileData.Body);
        
            

            /* fs.writeFileSync(`./assets/plan_pdf/temp-${fileName}`, fileData.Body); */


            /* const setOptionsPDFtoPNG = {
                type: 'png',                                // png or jpg, default jpg
                size: 3048,                                 // default 1024
                density: 300,                               // default 600
                outputdir: `${request.__dirname}/assets/plan_pdf`, // output folder, default null (if null given, then it will create folder name same as file name)
                outputname: `${String(planId)}`,                         // output file name, dafault null (if null given, then it will create image name same as input name)
                page: null                                  // convert selected page, default null (if null given, then it will convert all pages)
            }; */
            
            // let rsInfo = await pdfToPngLocal(`./assets/plan_pdf/temp-${fileName}`, setOptionsPDFtoPNG);
            
            // let fd = await fs.writeFileSync(`${request.__dirname}/assets/plan_pdf` + path.sep + fileName, fileData.Body)
            
            planArrays = [];

            for(let iFile of fileData.data.data.urls){
                planId = ObjectId();
                planArrays.push({
                    file:process.env.BUCKET_URL+iFile,
                    name:fileName.split(".")?.[0],
                    planId:planId,
                    original_file: decodeURIComponent(originalFileArray[planArrays.length])
                })
            }
            return planArrays;
            /* if(rsInfo && rsInfo.result == "success"){
                fs.unlinkSync(`./assets/plan_pdf/temp-${fileName}`);
                let planArrays = [];
                for(const fileInfo of rsInfo.message){
                    planId = ObjectId();
                    console.log(fileInfo, "fileInfo")
                    let fileBase64 = fs.readFileSync(fileInfo.path);
                    var fileRs = await fileUpload.bufferFile({
                        body:fileBase64,
                        file_name:`project/${(projectId ? projectId+"/":"")}plan/${planId}/${fileInfo.name}`,
                        planId:planId,
                    });
                    fs.unlinkSync(fileInfo.path);
                    planArrays.push({file:decodeURIComponent(fileRs), name:fileInfo.name,planId:planId,});
                }
                
                return planArrays;
            }else{
                fs.unlinkSync(`./assets/plan_pdf/temp-${fileName}`);
                return [];
            } */

            
            
        
        
        //return response.send(util.success( {message:".plan_pdf_created_success"}));
        }else{
            return planArrays;
        }
    } catch (err) {
        console.log(err, "Error in pdf2img");
        // fs.unlinkSync(`./assets/plan_pdf/temp-${fileName}`);
        
        return planArrays;
    }
}

Helper.prototype.minutesToHoursConvert = (n) => {
    var num = n;
    var hours = (num / 60);
    var rhours = Math.floor(hours);
    var minutes = (hours - rhours) * 60;
    var rminutes = Math.round(minutes);

    return rhours + ":" + rminutes;
}

Helper.prototype.createThumbnails = async (thumbOptions) => {
    let responseData = { status: null, message: "", url:"" }
    try {
        const Key = thumbOptions.url.split(`.amazonaws.com/`).pop();
        let fileData = await fileUpload.downloadFile(Key);        
        // const thumbnail = await imageThumbnail({ uri: thumbOptions.url }, thumbOptions.options);
        const semiTransparentRedPng = await sharp(fileData.Body).resize(thumbOptions.options.width, thumbOptions.options.height).png().toBuffer();
        var fileRs = await fileUpload.bufferFile({
            body:semiTransparentRedPng,
            file_name:thumbOptions.key,
            cont_type:thumbOptions.cont_type,
        });
        responseData.status = true;
        responseData.url = fileRs;
        responseData.message = "Thumbnail created successfully";
        return responseData;
    } catch (err) {
        console.error(err, "Sharp");
        responseData.status = false;
        responseData.message = err.message || "Failed to create thumbnail";
        return responseData;
    }
}

Helper.prototype.zipFiles = async (files, reqData, callBacke) => {
    if(files && files.length <= 0) return false;
    
    const zipName = `./assets/share/file/${new Date().getTime()}.zip`;
    const output = fs.createWriteStream(zipName);
    const archive = await  archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
    });

    const uploadZip = async () => {
        var fileRs = await fileUpload.bufferFile({
            body:fs.createReadStream(zipName),
            file_name:`project/${reqData.project_id}/files/share/${new Date().getTime()}.zip`,
            cont_type:"application/zip",
        });
        fs.unlinkSync(zipName);
        callBacke({file :fileRs});
    }

    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    output.on('close', function() {
        console.log(archive.pointer() + ' total bytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');
        
        uploadZip();
    });

    // This event is fired when the data source is drained no matter what was the data source.
    // It is not part of this library but rather from the NodeJS Stream API.
    // @see: https://nodejs.org/api/stream.html#stream_event_end
    output.on('end', function() {
        console.log('Data has been drained');
        uploadZip();
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function(err) {
        console.log("Warning: " + err);
        if (err.code === 'ENOENT') {            
            // log warning
        } else {
            // throw error
            throw err;
        }
    });

    // good practice to catch this error explicitly
    archive.on('error', function(err) {
        console.log("Error: " + err);
        if(fs.existsSync(zipName)){            
            fs.unlinkSync(zipName);
        }
        
        throw err;
    });
    // pipe archive data to the file
    archive.pipe(output);

    // append a file from stream
    for(let i=0; i<files.length; i++){
        // archive.append(fs.createReadStream(files[i]), { name: files[i].split("/").pop() });
        archive.file(files[i], { name: files[i].split("/").pop() });
    }
    // finalize the archive (ie we are done appending files but streams have to finish yet)
    // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
    archive.finalize();    
}

Helper.prototype.getIconByType = (type) => {
    let groupType = "";
    const groups = Object.entries(CONSTANTS.FILE_TYPE_GROUP);
    for(let i = 0; i < groups.length; i++){
        const group = groups[i];
        if(group[1].includes(type)){
            groupType = group[0];
            break;
        }
    }

    if(!groupType) groupType = "other";
    
    return CONSTANTS.FILE_ICONS[groupType];
}

Helper.prototype.capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
}



const getMaxNextLine = (input, maxChars = 20) => {
    // Split the string into an array of words.
    const allWords = input.split(" ");
    // Find the index in the words array at which we should stop or we will exceed
    // maximum characters.
    const lineIndex = allWords.reduce((prev, cur, index) => {
      if (prev?.done) return prev;
      const endLastWord = prev?.position || 0;
      const position = endLastWord + 1 + cur.length;
      return position >= maxChars ? { done: true, index } : { position, index };
    });
    // Using the index, build a string for this line ...
    const line = allWords.slice(0, lineIndex.index).join(" ");
    // And determine what's left.
    const remainingChars = allWords.slice(lineIndex.index).join(" ");
    // Return the result.
    return { line, remainingChars };
};

const formatTitle = (title) => {
let output = [];
// If the title is 40 characters or longer, look to add ellipses at the end of
// the second line.
if (title.length >= 40) {
    const firstLine = getMaxNextLine(title);
    const secondLine = getMaxNextLine(firstLine.remainingChars);
    output = [firstLine.line];
    let fmSecondLine = secondLine.line;
    if (secondLine.remainingChars.length > 0) fmSecondLine += " ...";
    output.push(fmSecondLine);
}
// If 20 characters or longer, add the entire second line, using a max of half
// the characters, making the first line always slightly shorter than the
// second.
else if (title.length >= 20) {
    const firstLine = getMaxNextLine(title, title.length / 2);
    output = [firstLine.line, firstLine.remainingChars];
}
// Otherwise, return the short title.
else {
    output = [title];
}

return output;
};

Helper.prototype.generateUserProfileImage = async (userObj) => {

    const post = {
      title: userObj.title,      
    };
    const titleText = formatTitle(post.title);

    const width = 150;
    const height = 150;
    const titleY = titleText.length === 2 ? 80 : 103;
    const titleLineHeight = 100;
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");

    context.fillStyle = "hsl(" + Math.random() * 360 + ", 100%, 75%)";
    context.fillRect(0, 0, width, height);

    context.font = "bold 50pt 'PT Sans'";
    context.textAlign = "center";
    context.fillStyle = "#63666a";

    context.fillText(titleText[0], 75, titleY);
    if (titleText[1]) context.fillText(titleText[1], 75, titleY + titleLineHeight);
    const buffer = canvas.toBuffer("image/png");
    // fs.writeFileSync("./assets/image.png", buffer);

    var fileRs = await fileUpload.bufferFile({
        body:buffer,
        file_name:`user/profile/${userObj.user_id}/${new Date().getTime()}-${userObj.title}.png`,
        cont_type:"image/png",
    });
    return fileRs;
}

Helper.prototype.getCurrentFinancialYear = (date)=> {
    var fiscalyear = "";
    var today = date ? new Date(date) : new Date();
    let lastYear = null;
    if ((today.getMonth() + 1) <= 3) {
        lastYear = today.getFullYear()+"".slice(2,4);
        fiscalyear = (today.getFullYear() - 1) + "-" + lastYear;
    } else {
        lastYear = ((today.getFullYear() + 1)+"").slice(2,4);
        fiscalyear = today.getFullYear() + "-" + lastYear;
    }
    return fiscalyear.slice()
}

Helper.prototype.setReportPdfHeader = async (binaryString="") => {
    const pdf = await PDFDocument.load(binaryString);
    const totalPageNumber = pdf.getPageCount();
    const jpgImage = await pdf.embedPng(`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`);
    
    const jpgDims = jpgImage.scale(0.25);
    const pdfPages = pdf.getPages();
    pdfPages.forEach((page, index) => {
        page.drawText(`Powered by`, {
            x: 20,
            y: 5,
            size: 9
        });
        
        page.drawImage(
            jpgImage,
            {
                x: 70,
                y: 5,
                width: jpgDims.width,
                height: jpgDims.height,
            },
            "center"
        );

        page.drawText(`Page ${index + 1} | ${totalPageNumber}`, {
            x: page.getWidth() - 60,
            y: 5,
            size: 9
        });
    });
    binaryString = await pdf.save();    
    return Buffer.from(binaryString);
};

module.exports =new Helper();