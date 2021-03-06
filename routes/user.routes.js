const express = require('express')
const { get } = require('mongoose')
const { findByIdAndUpdate, getMaxListeners } = require('../models/user.model')
const router = express.Router()

const User = require('../models/user.model')
const Article = require("../models/article.model")
const Game = require("../models/game.model")

// Middleware that checks that user is logged in
const isLoggedIn = (req, res, next) => {

    if (req.isAuthenticated()) {

        next()
    } else {

        req.session.errorMessage = 'Please Log in to access'
        res.redirect('/login')
    }
}

// READ (Profile view)

router.get('/home', (req, res) => res.redirect(`/users/${req.user.username}`))

// DELETE (For deleting the user)

router.post('/follow/:id', isLoggedIn, (req, res, next) => {

    User.findByIdAndUpdate(req.user.id, { $push: { following: req.params.id } })
        .then(() => res.redirect(`/users/${req.body.username}`))
        .catch(err => next(err))

})

router.get('/:id/reviews', (req, res, next) => {

    Article.find({ creatorId: req.params.id, type: 'REVIEW' }).sort({ createdAt: -1 }).populate('gameId', 'title')
        .then(matchedArticles => {

            console.log(matchedArticles)
            res.render('user/reviews', { matchedArticles })
        })
})

//User colleccions
router.post("/add/:gameId", isLoggedIn, (req, res, next) => {
    const id = req.params.gameId
    const { colleccion } = req.body
    console.log(id)

    User.findByIdAndUpdate(req.user.id, { $push: { [colleccion]: id } })
        .then(() => res.redirect('/games'))
        .catch(err => next(err))
})

//Collections display
router.get("/collection/:type", (req, res, next) => {
    const collection = req.params.type

    User.findById(req.user.id, { [collection]: 1 })
        .populate(`${collection}`)
        .then(games => res.render("games/index", { games: games[`${collection}`] }))
        .catch(err => next(new Error(err)))
})


// UPDATE (Edit my profile)
router.get('/settings', isLoggedIn, (req, res) => res.redirect(`/users/${req.user.username}/settings`))

router.get('/:username/settings', isLoggedIn, (req, res) => res.render('user/settings', { user: req.user }))

router.post('/:id/settings', isLoggedIn, (req, res, next) => {

    const { username, email } = req.body

    User.find({ $and: [{ username: { $ne: req.user.username } }, { $or: [{ username }, { email }] }] })
        .then(userMatch => {

            console.log(userMatch)

            if (userMatch.length) {

                let errorMessage

                userMatch[0].username === username ? errorMessage = 'This username is already in use' : errorMessage = 'This email is already in use'

                res.render('user/settings', { errorMessage, user: req.user })

                return
            }

            return User.findByIdAndUpdate(req.params.id, { username, email })
        })
        .then((response) => response ? res.redirect('/users/home') : null)
        .catch(err => next(err))
})

// READ
router.get('/:username', isLoggedIn, (req, res, next) => {

    // The logged user is the owner of the visited profile
    if (req.params.username === req.user.username) {


        // We find the followers of the user
        User.find({ following: req.user.id }, { _id: 1 })
            .then(followers => {
                console.log('Yesssssa!!!')

                res.render('user/profile', { matchedUser: req.user, loggedUser: req.user, isOwner: true, followers: followers.length })
            })
            .catch(err => next(err))

    } else {

        // We find who the user of the visited profile is
        User.find({ username: req.params.username })
            .then(matchedUser => {

                // We find the followers of the user
                User.find({ following: matchedUser[0].id }, { _id: 1 })
                    .then(followers => {

                        let isFollowing

                        req.user.following.includes(matchedUser[0].id) ? isFollowing = true : isFollowing = false

                        res.render('user/profile', { matchedUser: matchedUser[0], loggedUser: req.user, isOwner: false, isFollowing, followers: followers.length })

                    })
            })
            .catch(err => next(err))

    }
})


module.exports = router