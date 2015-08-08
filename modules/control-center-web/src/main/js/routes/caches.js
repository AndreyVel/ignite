/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var _ = require('lodash');
var router = require('express').Router();
var db = require('../db');

/* GET caches page. */
router.get('/', function (req, res) {
    res.render('configuration/caches');
});

/**
 * Get spaces and caches accessed for user account.
 *
 * @param req Request.
 * @param res Response.
 */
router.post('/list', function (req, res) {
    var user_id = req.currentUserId();

    // Get owned space and all accessed space.
    db.Space.find({$or: [{owner: user_id}, {usedBy: {$elemMatch: {account: user_id}}}]}, function (err, spaces) {
        if (err)
            return res.status(500).send(err.message);

        var space_ids = spaces.map(function (value) {
            return value._id;
        });

        // Get all caches type metadata for spaces.
        db.CacheTypeMetadata.find({space: {$in: space_ids}}, '_id name kind', function (err, metadatas) {
            if (err)
                return res.status(500).send(err);

            // Get all caches for spaces.
            db.Cache.find({space: {$in: space_ids}}).sort('name').exec(function (err, caches) {
                if (err)
                    return res.status(500).send(err.message);

                // Remove deleted metadata.
                _.forEach(caches, function (cache) {
                    cache.queryMetadata = _.filter(cache.queryMetadata, function (metaId) {
                        return _.findIndex(metadatas, function (meta) {
                            return meta._id.equals(metaId);
                        }) >= 0;
                    });

                    cache.storeMetadata = _.filter(cache.storeMetadata, function (metaId) {
                        return _.findIndex(metadatas, function (meta) {
                            return meta._id.equals(metaId);
                        }) >= 0;
                    });
                });

                var metadatasJson = metadatas.map(function (meta) {
                    return {value: meta._id, label: meta.name, kind: meta.kind};
                });

                res.json({spaces: spaces, metadatas: metadatasJson, caches: caches});
            });
        });
    });
});

/**
 * Save cache.
 */
router.post('/save', function (req, res) {
    if (req.body._id)
        db.Cache.update({_id: req.body._id}, req.body, {upsert: true}, function (err) {
            if (err)
                return res.status(500).send(err.message);

            res.send(req.body._id);
        });
    else {
        db.Cache.findOne({space: req.body.space, name: req.body.name}, function (err, cache) {
            if (err)
                return res.status(500).send(err.message);

            if (cache)
                return res.status(500).send('Cache with name: "' + cache.name + '" already exist.');

            (new db.Cache(req.body)).save(function (err, cache) {
                if (err)
                    return res.status(500).send(err.message);

                res.send(cache._id);
            });
        });
    }
});

/**
 * Remove cache by ._id.
 */
router.post('/remove', function (req, res) {
    db.Cache.remove(req.body, function (err) {
        if (err)
            return res.status(500).send(err.message);

        res.sendStatus(200);
    })
});

module.exports = router;
