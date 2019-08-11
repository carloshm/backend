import { User, Model } from '../models'
import { log, randomAvatar } from '../utils'
import fs from 'fs'
import path from 'path'
import config from '../config'

function ModelController() {}

// CRUD basics
ModelController.prototype.create = function(req, res) {
  if (!req.body) return res.sendStatus(400)
  if (!req.user._id) return res.sendStatus(400)
  User.findById(req.user._id, (err, user) => {
    if (err || user === null) return res.sendStatus(400)
    let handle = uniqueHandle()
    let model = new Model({
      handle,
      user: user.handle,
      name: req.body.name,
      units: req.body.units,
      breasts: req.body.breasts,
      picture: handle + '.svg',
      created: new Date()
    })
    model.createAvatar()
    log.info('modelCreated', { handle: model.handle })
    return saveAndReturnModel(res, model, user.handle)
  })
}

ModelController.prototype.read = function(req, res) {
  if (!req.body) return res.sendStatus(400)
  if (!req.user._id) return res.sendStatus(400)
  User.findById(req.user._id, (err, user) => {
    if (err || user === null) return res.sendStatus(400)
    Model.findOne({ handle: req.params.handle }, (err, model) => {
      if (err) return res.sendStatus(400);
      if (model === null) return res.sendStatus(404)
      return res.send({ model: model.info() })
    })
  })
}

ModelController.prototype.update = (req, res) => {
  var async = 0
  if (!req.user._id) return res.sendStatus(400)
  User.findById(req.user._id, async (err, user) => {
    if (err || user === null) return res.sendStatus(400)
    Model.findOne({ handle: req.params.handle }, (err, model) => {
      if (err || model === null) return res.sendStatus(400)
      let data = req.body
      if (typeof data.name === 'string') model.name = data.name
      if (typeof data.notes === 'string') model.notes = data.notes
      if (typeof data.units === 'string') model.units = data.units
      if (typeof data.breasts === 'string') model.breasts = data.breasts === 'true' ? true : false
      if (typeof data.measurements !== 'undefined')
        model.measurements = {
          ...model.measurements,
          ...data.measurements
        }
      if (typeof data.picture !== 'undefined') model.saveAvatar(data.picture)

      return saveAndReturnModel(res, model, user.handle)
    })
  })
}

ModelController.prototype.delete = (req, res) => {
  if (!req.user._id) return res.sendStatus(400)
  User.findById(req.user._id, async (err, user) => {
    if (err || user === null) return res.sendStatus(400)
    Model.deleteOne({ handle: req.params.handle, user: user.handle }, err => {
      if (err) return res.sendStatus(400)
      else return res.sendStatus(204)
    })
  })
}

// Delete multiple
ModelController.prototype.deleteMultiple = function(req, res) {
  if (!req.body) return res.sendStatus(400)
  if (!req.body.models) return res.sendStatus(400)
  if (!req.user._id) return res.sendStatus(400)
  User.findById(req.user._id, (err, user) => {
    if (err || user === null) return res.sendStatus(400)
    let models = req.body.models
    if (models.length < 1) return res.sendStatus(400)
    let handles = []
    for (let handle of models) handles.push({ handle })
    Model.deleteMany(
      {
        user: user.handle,
        $or: handles
      },
      err => {
        if (err) return res.sendStatus(500)
        const models = {}
        Model.find({ user: user.handle }, (err, modelList) => {
          if (err) return res.sendStatus(400)
          for (let model of modelList) models[model.handle] = model
          res.send({ models })
        })
      }
    )
  })
}

// Clone
ModelController.prototype.clone = function(req, res) {}

function saveAndReturnModel(res, model) {
  model.save(function(err, updatedModel) {
    if (err) {
      log.error('modelUpdateFailed', updatedModel)
      return res.sendStatus(500)
    }

    return res.send({ model: updatedModel.info() })
  })
}


const newHandle = (length = 5) => {
  let handle = ''
  let possible = 'abcdefghijklmnopqrstuvwxyz'
  for (let i = 0; i < length; i++)
    handle += possible.charAt(Math.floor(Math.random() * possible.length))

  return handle
}

const uniqueHandle = () => {
  let handle, exists
  do {
    exists = false
    handle = newHandle()
    Model.findOne({ handle: handle }, (err, model) => {
      if (model !== null) exists = true
    })
  } while (exists !== false)

  return handle
}

export default ModelController
