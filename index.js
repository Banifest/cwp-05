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
    '/api/comments/delete': commentsDelete
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
    const art = new Article(articles[articles.length > 0 ? articles.length - 1: 0].id + 1, payload.title, payload.text, payload.author, []);
    articles.push(art);

    ALL_ARTICLES = JSON.stringify(articles);
    fs.writeFile('articles.json', ALL_ARTICLES, ()=> {});
    cb(null, JSON.stringify(art));
}

function articleUpdate(req, res, payload, cb)
{
    const articles = JSON.parse(ALL_ARTICLES);
    for(let iter of articles)
    {
        if(iter.id === payload.id)
        {
            iter.title=payload.title;
            iter.text=payload.text;
            iter.author=payload.author;
        }
    }
    ALL_ARTICLES = JSON.stringify(articles);
    fs.writeFile('articles.json', ALL_ARTICLES, ()=> {});
    cb(null, "OK");
}

function articleDelete(req, res, payload, cb)
{

    const articles = JSON.parse(ALL_ARTICLES);
    const newArticles = [];
    for(let iter of articles)
    {
        if(iter.id !== payload.id)
        {
            newArticles.push(iter);
        }
    }
    ALL_ARTICLES = JSON.stringify(articles);
    fs.writeFile('articles.json', ALL_ARTICLES, ()=> {});
    cb(null, "OK");
}

function commentsCreate(req, res, payload, cb)
{
    const articles = JSON.parse(ALL_ARTICLES);

    for(let iter of articles)
    {
        if(iter.id === payload.articleId)
        {
            iter.comments.push(new Comment(iter.comments[iter.comments.length > 0? iter.comments.length - 1: 0] + 1,
                payload.articleId,
                payload.text,
                payload.author));
        }
    }

    console.log("aa");
    ALL_ARTICLES = JSON.stringify(articles);
    fs.writeFile('articles.json', ALL_ARTICLES, ()=> {});
    cb(null, "OK");
}

function commentsDelete(req, res, payload, cb)
{
    const articles = JSON.parse(ALL_ARTICLES);

    for(let iter of articles)
    {
        if(iter.id === payload.articleId)
        {
            let newComments = [];
            for(subIter of iter.comments)
            {
                if(subIter.id !== payload.id)
                {
                    newComments.push(subIter);
                }
            }
            iter.comments = newComments;
        }
    }

    ALL_ARTICLES = JSON.stringify(articles);
    fs.writeFile('articles.json', ALL_ARTICLES, ()=> {});
    cb(null, "OK");
}

function notFound(req, res, payload, cb)
{
    cb({ code: 404, message: 'Not found'});
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

        cb(null, params);
    });
}