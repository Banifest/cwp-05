const http = require('http');
const fs = require('fs');

const hostname = '127.0.0.1';
const port = 3000;


class Article
{
    constructor(id, title="", text="", author="", comments=[])
    {
        this.id = id;
        this.title = title;
        this.text = text;
        this.date = (new Date).getTime();
        this.author = author;
        this.comments = comments;
    }
}

class Comment
{
    constructor(id, articleId, text="", author="")
    {
        this.id = id;
        this.articleId = articleId;
        this.text = text;
        this.date = (new Date).getTime();
        this.author = author;
    }
}

const handlers =
{
    '/sum': sum,
    '/api/article/readall': articleReadAll,
    '/api/article/read': articleRead,
    '/api/article/create': articleCreate,
    '/api/article/update': articleUpdate,
    '/api/article/delete': articleDelete,
    '/api/comments/create': commentsCreate,
    '/api/comments/delete': commentsDelete,
    '/api/logs': getLogs
};


var ALL_ARTICLES = fs.readFileSync('articles.json','utf-8').toString().replace(/\n/g,"").replace(/\r/g,"");

const server = http.createServer((req, res) =>
{
    try
    {
        parseBodyJson(req, (err, payload) =>
        {
            const handler = getHandler(req.url);
            fs.appendFile('logs.log',
                          `Время запроса: ${(new Date()).toDateString()}\n`+
                          `URL: ${req.url}\n\n\n\n`, ()=>{});

            handler(req, res, payload, (err, result) =>
            {
                if (err)
                {
                    res.statusCode = err.code;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(err));

                    return;
                }

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(result));
            });
        });
    }
    catch (err)
    {
        res.end("Ошибка при передаче параметров");
    }
});

server.listen(port, hostname, () =>
{
    console.log(`Server running at http://${hostname}:${port}/`);
});

function getHandler(url)
{
    return handlers[url] || notFound;
}

    function sum(req, res, payload, cb)
    {
        const result = {c: payload.a + payload.b};
        cb(null, result);
    }

    function articleReadAll(req, res, payload, cb)
    {
        payload.sortField = !payload.sortField ? 'date' : payload.sortField;
        payload.sortOrder = !payload.sortOrder ? 'desk' : payload.sortOrder;

        const articles = JSON.parse(ALL_ARTICLES);
        articles.sort((a, b) =>
                      {
                          let mul = 1;
                          payload.sortOrder === 'asc' ? mul = -1 : mul = 1;

                          if (a[payload.sortField] < b[payload.sortField])
                          {
                              return mul;
                          }
                          else
                          {
                              return -mul;
                          }
                      });

        payload.page = !payload.page ? 1 : payload.page;
        payload.limit = !payload.limit ? 10 : payload.limit;
        payload.includeDeps = !payload.includeDeps ? false : payload.includeDeps;


        const answer = [];
        for (let i = (payload.limit) * (payload.page - 1); i < articles.length && i < payload.limit * payload.page; i++)
        {
            articles[i].comments = !payload.includeDeps ? undefined : articles[i].comments;
            answer.push(articles[i]);
        }


        a = {items: answer, meta: {page:payload.page,
                                   pages:Math.trunc((articles.length / payload.limit + 1)),
                                   count:Math.trunc(articles.length),
                                   limit:Math.trunc(payload.limit)}};
        cb({code: 200, message: a});
    }

    function articleRead(req, res, payload, cb)
    {
        const articles = JSON.parse(ALL_ARTICLES);
        console.log(articles);
        cb(null, articles[payload.id] || "not correct id");
    }

    function articleCreate(req, res, payload, cb)
    {
        const articles = JSON.parse(ALL_ARTICLES);
        const art = new Article(!articles.length? 0: articles[articles.length > 0 ? articles.length - 1 : 0].id + 1,
                                payload.title,
                                payload.text,
                                payload.author, []);
        articles.push(art);

        ALL_ARTICLES = JSON.stringify(articles);
        fs.writeFile('articles.json', ALL_ARTICLES, () => {});
        cb(null, JSON.stringify(art));
    }

    function articleUpdate(req, res, payload, cb)
    {
        const articles = JSON.parse(ALL_ARTICLES);
        for (let iter of articles)
        {
            if (iter.id === payload.id)
            {
                iter.title = payload.title;
                iter.text = payload.text;
                iter.author = payload.author;
            }
        }
        ALL_ARTICLES = JSON.stringify(articles);
        fs.writeFile('articles.json', ALL_ARTICLES, () => {});
        cb(null, "OK");
    }

    function articleDelete(req, res, payload, cb)
    {

        const articles = JSON.parse(ALL_ARTICLES);
        const newArticles = [];
        for (let iter of articles)
        {
            if (iter.id !== payload.id)
            {
                newArticles.push(iter);
            }
        }
        ALL_ARTICLES = JSON.stringify(newArticles);
        fs.writeFile('articles.json', ALL_ARTICLES, () => {});
        cb(null, "DELETE");
    }

    function commentsCreate(req, res, payload, cb)
    {
        const articles = JSON.parse(ALL_ARTICLES);
        let isTrue = false;

        for (let iter of articles)
        {
            if (iter.id === Number(payload.articleId))
            {
                isTrue = true;
                iter.comments.push(
                    new Comment(!iter.comments.length? 0: Number(iter.comments[iter.comments.length - 1].id) + 1,
                        Number(payload.articleId),
                        payload.text,
                        payload.author));
                break

            }
        }

        ALL_ARTICLES = JSON.stringify(articles);
        fs.writeFile('articles.json', ALL_ARTICLES, () => {});
        cb(null, isTrue? "OK" : "not correct id");
    }

    function commentsDelete(req, res, payload, cb)
    {
        const articles = JSON.parse(ALL_ARTICLES);

        let isTrue = false;
        for (let iter of articles)
        {
            if (iter.id === Number(payload.articleId))
            {
                let newComments = [];
                for (subIter of iter.comments)
                {
                    if (subIter.id !== Number(payload.id))
                    {
                        newComments.push(subIter);
                    }
                    else
                    {
                        isTrue = true;
                    }
                }
                iter.comments = newComments;
            }
        }

        ALL_ARTICLES = JSON.stringify(articles);
        fs.writeFile('articles.json', ALL_ARTICLES, () => {});
        cb(null, isTrue? "OK": "not found comments with this id");
    }
//catch (err)
//{
//    cb({ code: 400, message: 'Request Invalid'});
//}

function notFound(req, res, payload, cb)
{
    cb({ code: 404, message: 'Not found'});
}


function getLogs(req, res, payload, cb)
{
    fs.readFile('logs.log', (err, data)=>
    {
        //cb({ null,  data.toString()});
    });
}

function wrongId(req, res, payload, cb)
{
    cb({ code: 888, message: 'Wrong id'});
}


function parseBodyJson(req, cb)
{
    let body = [];

    req.on('data', function(chunk)
    {
        body.push(chunk);
    }).on('end', function()
    {
        body = Buffer.concat(body).toString();
        let params = JSON.parse(body);
        fs.appendFile('logs.log', `JSON: ${body}\n`);
        cb(null, params);
});
}