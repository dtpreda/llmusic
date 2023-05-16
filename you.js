function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

function parseEventData(data) {
    const lines = data.split('\n');
    const result = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('event:')) {
        const eventName = line.substring(6).trim();
        if (eventName == "youChatToken") {
            let data = lines[i+1].substring(5)
            result.push(JSON.parse(data)['youChatToken'])
        }
        }
    }

    return result.join('');
}


function extractSongs(text) {
    // find all lines that start with '-' or with a number followed by a dot
    const lines = text.split('\n');
    const result = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('-') || line.match(/^\d+\./)) {
            result.push(line);
        }
    }

    //remove '-' and numbers followed by a dot
    // split by comma, by '-' and by 'by'
    result.forEach(function(item, index, array) {
        array[index] = item.replace(/^-/, '').replace(/^\d+\./, '').trim().split(',').join('').split('-').join('').split('by').join('').trim();
        array[index] = array[index].substring(array[index].indexOf('"') + 1).split('"');
        array[index][0] = array[index][0].trim();
        array[index][1] = array[index][1].trim();
        array[index][1] = array[index][1].replace(/ft./g, '').replace(/feat./g, '').replace(/with/g, '').replace(/and/g, '').replace(/by/g, '').replace(/featuring/g, '').trim();
        array[index][0] = array[index][0].replace(/([.])/g, '');
        array[index][1] = array[index][1].replace(/([.])/g, '');
        array[index][0] = array[index][0].replace(/'/g, '%27');
        array[index][1] = array[index][1].replace(/'/g, '%27');
    });

    //console.log(result);

    return result;
}
  

class Completion {
    static async create(prompt, page=1, count=10, safe_search='Moderate', on_shopping_page=false, mkt='', response_filter='WebPages,Translations,TimeZone,Computation,RelatedSearches', domain='youchat', query_trace_id=null, chat=null, include_links=false, detailed=false, debug=false) {
        
        if (chat == null) {
            chat = [];
        }

        const headers = Completion.__get_headers();

        const params = {
            'q': prompt,
            'page': page,
            'count': count,
            'safeSearch': safe_search,
            'onShoppingPage': on_shopping_page,
            'mkt': mkt,
            'responseFilter': response_filter,
            'domain': domain,
            'queryTraceId': query_trace_id == null ? uuidv4() : query_trace_id,
            'chat': JSON.stringify(chat),  // {'question':'','answer':' '}
        };


        const queryString = Object.keys(params).map(key => key + '=' + params[key]).join('&');

        let songs = [];
        await fetch(`https://you.com/api/streamingSearch?${queryString}`, { headers }).then(async function(response) {
            songs = await response.text().then(function(text) {
                let result = parseEventData(text);
                let extraction = extractSongs(result);
                //console.log(extraction);
                document.getElementById("result").innerHTML = result;
                return extraction;
            });
        }).catch(function(error) {
            console.log("response not ok");
            document.getElementById("result").innerHTML = Completion.__get_failure_message();
        });

        return songs;
    }

    static __get_headers() {
        return {
            'accept': 'text/event-stream',
            'accept-language': 'en,fr-FR;q=0.9,fr;q=0.8,es-ES;q=0.7,es;q=0.6,en-US;q=0.5,am;q=0.4,de;q=0.3',
            'referer': 'https://you.com/search?q=who+are+you&tbm=youchat',
            'sec-ch-ua': '"Not_A Brand";v="99", "Google Chrome";v="109", "Chromium";v="109"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'cookie': `safesearch_guest=Moderate; uuid_guest=${uuidv4().toString()}`,
        };
    }

    static __get_failure_response() {
        return { response: 'Unable to fetch the response, Please try again.', links: [], extra: {} };
    }

    static __get_failure_message() {
        return 'Unable to contact LLM. Please try up to 5 times. If the problem persists, please try again later.';
    }
}

export { Completion };
