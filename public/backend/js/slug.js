const slug = (inputNameSelector, inputSlugSelector) => {
    const change_alias = (alias) => {
        let str = alias;
        str = str.toLowerCase();
        str = str.replace(/a|á|à|ả|ã|ạ|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/g, "a");
        str = str.replace(/e|é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/g, "e");
        str = str.replace(/i|í|ì|ỉ|ĩ|ị/g, "i");
        str = str.replace(/o|ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ/g, "o");
        str = str.replace(/u|ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/g, "u");
        str = str.replace(/y|ý|ỳ|ỷ|ỹ|ỵ/g, "y");
        str = str.replace(/đ/g, "d");
        str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, " ");
        str = str.replace(/ *? /g, "-");
        str = str.trim();
        return str;
    }

    let inputName = document.querySelector(inputNameSelector);
    let inputSlug = document.querySelector(inputSlugSelector);

    inputName.onkeyup = (e) => {
        inputSlug.value = change_alias(e.target.value)
    }
}
