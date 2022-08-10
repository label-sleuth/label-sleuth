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

/**
 * Implements the logic of deciding what's the resulting state of an element label based
 * on its current label and the label action
 * @param {The element's current label value. It can be '', 'neg' or 'pos'} currentLabel 
 * @param {The label action. It can be: 'neg' or 'pos'} action 
 * @returns 
 */
export const getNewLabelState = (currentLabel, action) => {
    let documentLabelCountChange;
    let newLabel;
    if (currentLabel === 'pos') {
      if (action === "pos") {
        documentLabelCountChange = {
          pos: -1,
          neg: 0,
        };
        newLabel = "none";
      } else if (action === "neg") {
        documentLabelCountChange = {
          pos: -1,
          neg: 1,
        };
        newLabel = "neg";
      }
    } else if (currentLabel === "neg") {
      if (action === "pos") {
        documentLabelCountChange = {
          pos: 1,
          neg: -1,
        };
        newLabel = "pos";
      } else if (action === "neg") {
        documentLabelCountChange = {
          pos: 0,
          neg: -1,
        };
        newLabel = "none";
      }
    } else {
      if (action === "pos") {
        documentLabelCountChange = {
          pos: 1,
          neg: 0,
        };
        newLabel = "pos";
      } else if (action === "neg") {
        documentLabelCountChange = {
          pos: 0,
          neg: 1,
        };
        newLabel = "neg";
      }
    }
    return {
      documentLabelCountChange,
      newLabel,
    };
  };

/**
 * Get's the boolean string of a label value, because currently we are using 
 * 'pos' or 'neg' for internal labelling processes and 'true' or 'false' for
 * the the REST API.
 * @param {*} label 
 * @returns 
 */
export const getBooleanLabel = (label) => {
    return label === "pos" ? "true" : label === "neg" ? "false" : "none";
}

/**
 * Parses the elements of a document extracting the user labels
 * @param {list of elements of a document} elements
 * @param {The current selected category} curCategory
 * @param {whether to add the id of the element in its entry key} includeId
 * @returns
 */
 export const parseElements = (elements, curCategory, includeId=false) => {
  let initialFocusedState = {};
  let initialLabelState = {};

  let documentPos = 0;
  let documentNeg = 0; 

  for (const [i, element] of elements.entries()) {
    let index = "L" + i
    index = includeId ? `L${i}-${element.id}` : `L${i}`
    initialFocusedState[index] = false;
    const userLabels = element["user_labels"];
    if (curCategory in userLabels) {
      const label = userLabels[curCategory]
      if (label === "true") {
        initialLabelState[index] = "pos";
        documentPos += 1;
      } else if (label === "false") {
        initialLabelState[index] = "neg";
        documentNeg += 1;
      }
    } else {
      initialLabelState[index] = "";
    }
  }
  return {
    initialFocusedState,
    initialLabelState,
    documentPos,
    documentNeg,
  };
};
