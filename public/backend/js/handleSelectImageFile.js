const handleSelectImageFile = (inputSelector, imageSelector) => {
    let inputFile = document.querySelector(inputSelector);
    let image = document.querySelector(imageSelector);

    if (inputFile && image) {
        inputFile.onchange = async () => {
            let file = inputFile.files[0];

            if (file) {
                let strDataURI = await getBase64(file);
                image.src = strDataURI;
                image.style.display = "block";
            } else {
                image.src = "";
                image.style.display = "none";
            }
        }
    }
};

const getBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
});
