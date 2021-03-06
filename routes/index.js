module.exports = app => {

    // Base URLS
    app.use('/', require('./base.routes.js'))
    app.use('/users', require('./user.routes.js'))
    app.use("/games", require("./games.routes"))
    app.use("/articles", require("./articles.routes"))
    app.use("/companies", require("./companies.routes"))
    app.use("/api", require("./api.routes"))
    app.use("/events", require("./events.routes"))
}