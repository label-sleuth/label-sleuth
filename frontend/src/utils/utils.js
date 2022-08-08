export const handleError = (err) => {
    return err.message || "An error ocurred"
}

/**
* Returns the suffix of a number in its ordinal form
**/
export const getOrdinalSuffix = (x) => {
    // suffix pattern repeats every 100 numbers
    x %= 100
    let prefix = "th"
    if (x <= 3 || x >= 21) {
        switch (x % 10) {
            case 1: 
                prefix = "st"
                break;
            case 2: 
                prefix = "nd"
                break;
            case 3: 
                prefix = "rd"
        } 
    }
    return prefix
}
