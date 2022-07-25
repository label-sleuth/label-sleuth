export const handleError = (err) => {
    return err.message || "An error ocurred"
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