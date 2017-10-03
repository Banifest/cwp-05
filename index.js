const http = require('http');
const fs = require('fs');

const hostname = '127.0.0.1';
const port = 3000;


class article
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

class comment
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
    '/api/comments/create': commentsCreate
};


var ALL_ARTICLES = fs.readFileSync('articles.json','utf-8').toString().replace(/\n/g,"").replace(/\r/g,"");

const server = http.createServer((req, res) =>
{
    parseBodyJson(req, (err, payload) =>
    {
        const handler = getHandler(req.url);

        handler(req, res, payload, (err, result) => {
            if (err)
            {
                res.statusCode = err.code;
                res.setHeader('Content-Type', 'application/json');
                res.end( JSON.stringify(err) );

                return;
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end( JSON.stringify(result) );
        });
    });
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
    const result = { c: payload.a + payload.b };
    cb(null, result);
}

function articleReadAll(req, res, payload, cb)
{
    const result = ALL_ARTICLES;
    cb(null, result);
}

function articleRead(req, res, payload, cb)
{
    const articles = JSON.parse(ALL_ARTICLES);
    console.log(articles);
    cb(null, articles[payload.id]);
}

function articleCreate(req, res, payload, cb)
{
    const articles = JSON.parse(ALL_ARTICLES);
    const art = new article(articles.length + 1, payload.title, payload.text, payload.author, []);
    articles.push(art);

    fs.writeFile('articles.json', JSON.stringify(articles), ()=> {});

    cb(null, JSON.stringify(art));
}

function articleUpdate(req, res, payload, cb)
{
    const articles = JSON.parse(ALL_ARTICLES);
    articles[payload.id].title=payload.title;
    articles[payload.id].text=payload.text;
    articles[payload.id].author=payload.author;

    fs.writeFile('articles.json', JSON.stringify(articles), ()=> {});

    cb(null, JSON.stringify(articles));
}

function articleDelete(req, res, payload, cb)
{

}

function commentsCreate(req, res, payload, cb)
{

}

function notFound(req, res, payload, cb)
{
    cb({ code: 404, message: 'Not found'});
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

        cb(null, params);
    });
}