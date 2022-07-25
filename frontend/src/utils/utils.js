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
export const getCategoryQueryString = (curCategory) => {
    return curCategory !== null ? `category_id=${curCategory}` : null
}

export const getQueryParamsString = (queryParams) => {
    let queryParamsString = ''
    queryParams.forEach(param => {
        queryParamsString = param ? `${queryParamsString}${param}&` : queryParamsString
    })
    // add leading '?' removes last '&'
    queryParamsString = '?' + queryParamsString.substring(0, queryParamsString.length-1)
    // return an empty string if there are no query params
    return queryParamsString === '?' ? '' : queryParamsString
}
