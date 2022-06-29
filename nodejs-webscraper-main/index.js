const PORT = 8000
const axios = require('axios')
const cheerio = require('cheerio')
const Browser = require('zombie');
const express = require('express')
const app = express()
const cors = require('cors')
app.use(cors())

var fs = require('fs');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');


let urlNavrat = 'https://www.navratdoreality.cz/'
let urlNavratNumberOfPages = 3;
let minRating = 7;
var mapNavrat = new Map();


app.get('/', function (req, res) {
    res.setHeader('Content-type', 'text/html');
    res.render("response-index.html", );

})

app.get('/dira', function (req, res) {
    res.setHeader('Content-type', 'text/html');
    res.render("response-dira.html", );

})


app.get('/navrat', async (req, res) => {
    mapNavrat.clear();
    urlNavratNumberOfPages = 3;
    minRating = 7;
    if(req.query.load){
        if(parseInt(req.query.load) >= 1 && parseInt(req.query.load) < 21)
        urlNavratNumberOfPages = parseInt(req.query.load);
    }

    if(req.query.rating){
        if(parseInt(req.query.rating) >= 1 && parseInt(req.query.rating) <= 10)
            minRating = parseInt(req.query.rating);
    }

    console.log("/navrat");
    let responseCount = 0;
    for (let i = 0; i < urlNavratNumberOfPages + 1; i++) {
        const articles = [];
        if (i === 0) {
            urlNavrat = 'https://www.navratdoreality.cz/';
        } else {
            urlNavrat = 'https://navratdoreality.cz/?list-page=' + i + '&do=list-changePage';
        }
        articles.push({
            title: "Page: " + i + "    ",
            url: ""
        })
        axios(urlNavrat)
            .then(async response => {
                let html = response.data
                const $ = cheerio.load(html)

                $('.mainbar .item', html).each(function () { //<-- cannot be a function expression
                    const title = $(this).find('a strong').text()
                    const url = $(this).find('a').attr('href')
                    const img = $(this).find('img').attr('src')
                    const rating = $(this).find('.item-info-rank-val').text()
                    const date = $(this).find('.item-meta').text()
                    const info = $(this).find('.p-like').text()
                    if (title || url) {
                        articles.push({
                            title,
                            url,
                            img,
                            rating,
                            date,
                            info
                        })
                    }

                })
                console.log(i);
                responseCount += 1;

                mapNavrat.set(i, articles);

            }).catch(err => console.log(err))
    }

    while (responseCount < urlNavratNumberOfPages) {
        console.log("waiting");
        await new Promise(r => setTimeout(r, 3000));
    }
    const mapAsc = new Map([...mapNavrat.entries()].sort((a, b) => parseInt(a) - parseInt(b)));

    let items = Array.from( mapAsc.values() );
    items= items.flat(2);

    console.log("send response");

    res.setHeader('Content-type', 'text/html');
    res.render("response-navrat.html", {items: items, minRating: minRating});

})


app.listen(PORT, () => console.log(`server running on PORT ${PORT}`))

