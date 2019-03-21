/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var bcrypt = require('bcrypt')
var MongoClient = require('mongodb');
var ObjectId = require('mongodb').ObjectId;


const CONNECTION_STRING = process.env.DB

var expect = require('chai').expect;

module.exports = function (app) {
  
  app.route('/api/messageBoards')
    .get(function(req, res) {
      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        db.collection('threads').distinct('board', function(err, results) {
          if (err) throw err;
          res.send(results)
        })
      })
    })
  
  app.route('/api/threads/:board')    
      
    .post(function(req, res) {                        
      var msgBoard = req.body.board || req.params.board;      
      var msgTxt = req.body.text
      bcrypt.hash(req.body.delete_password, 10, function(err, hash) {
        if (err) throw err
        var delPwd = hash
        MongoClient.connect(CONNECTION_STRING, function(err, db) {
        if (err) throw err;        
        db.collection('threads').insertOne({
          board: msgBoard,
          thread_text: msgTxt,
          delete_password: delPwd,
          created_on: new Date(),
          bumped_on: new Date(),
          reported: false,
          replies: []
        }, function(err, result) {
          if (err) throw err;          
          res.redirect('/b/' + msgBoard + '/')
          })
        })
      })    
    })
    
    .get(function(req, res) {        
        var msgBoard = req.params.board        
        MongoClient.connect(CONNECTION_STRING, function(err, db) {                    
          db.collection('threads').find({board: msgBoard}, {reported:0, delete_password:0}).toArray(function(err, result) {            
            result.sort(function(a, b) {
              return new Date(b.bumped_on) - new Date(a.bumped_on)
            })
            result = result.slice(0, 10)            
            addReplies(0);
            
            function addReplies(i) {
              if (i < result.length) {                 
                db.collection('threads').find({thread_id: result[i]._id.toString()}, {reported:0, delete_password:0}).toArray(function(err, replies) {                  
                  result[i].replycount = replies.length
                  replies.sort(function(a, b) {
                    return new Date(b.created_on) - new Date(a.created_on)
                  })
                  replies = replies.slice(0, 3)
                  result[i].replies = replies
                  result[i].text = result[i].thread_text                  
                  addReplies(i+1)
                })
              } else {                
                res.send(result)
              }
            }
            
          })
        })
    })
  
    .delete(function(req, res) {      
      var thread_id = req.body.thread_id
      try {
        var id = ObjectId(thread_id)
      } catch (error) {
        res.type('text').send('Invalid ID ' + error)
        return
      }
      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        db.collection('threads').findOne({_id: id}, function(err, result) {
          if (result == undefined) {
            res.type('text').send('Invalid ID')
          } else {
            bcrypt.compare(req.body.delete_password, result.delete_password, function(err, result) {
              if (result) {
                db.collection('threads').deleteOne({_id: id}, function(err, doc) {
                  db.collection('threads').deleteMany({thread_id: thread_id}, function(err, docs) {
                    res.type('text').send('Success!')                
                  })                
                })
              } else {
                res.type('text').send('Incorrect Password')
              }
            })            
          }
        })        
      })
    })
  
    .put(function(req, res) {      
      var thread_id = ObjectId(req.body._id) // changed from report_id
      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        db.collection('threads').update({_id: thread_id}, {$set: {reported: 'true'}}, function(err, doc) {
          res.type('text').send('Success!')
        })
      })
    })
    
    
  app.route('/api/thread/:id')        
    .get(function(req, res) {
      var id = ObjectId(req.params.id)
      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        if (err) throw err;
        db.collection('threads').findOne({_id: id}, function(err, result) {
          res.send(result)
        })
      })
    
    })
  
  app.route('/api/replies/:board')
  
    .post(function(req, res) {    
        var msgBoard = req.params.board
        bcrypt.hash(req.body.delete_password, 10, function(err, hash) {
          if (err) throw err
          MongoClient.connect(CONNECTION_STRING, function(err, db) {
          if (err) throw err;          
          db.collection('threads').insertOne({            
            thread_id: req.body.thread_id,
            reply_text: req.body.text,
            delete_password: hash,
            created_on: new Date(),            
            reported: false,            
          }, function(err, result) {
            if (err) throw err;
            db.collection('threads').update({_id: ObjectId(req.body.thread_id)}, {$set: {bumped_on: new Date()}}, function(err, doc) {
              if (err) throw err;              
              var re = new RegExp('\/.*\/$')
              if (req.headers.referer.match(re)) {                
                res.redirect('/b/' + msgBoard + '/' + req.body.thread_id)               
              } else {                
                res.redirect('/api/replies/' + msgBoard + '?thread_id=' + req.body.thread_id)
              }
            })                      
            })
          })          
        })            
      })
  
    .get(function(req, res) {      
      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        db.collection('threads').findOne({_id: ObjectId(req.query.thread_id)}, {reported:0, delete_password:0}, function(err, result) {          
          db.collection('threads').find({thread_id: req.query.thread_id}, {reported:0, delete_password:0}).toArray(function(err, replies) {
            if (replies.length > 1) {
              replies.sort(function(a, b) {
              return new Date(b.created_on) - new Date(a.created_on)
              })              
            }
            result.replies = replies;
            res.send(result)
          })
        })
      })
    })
  
    .delete(function(req, res) {      
      var reply_id = ObjectId(req.body.reply_id);
      var password = req.body.delete_password;      
      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        db.collection('threads').findOne({_id: reply_id}, function(err, result) {
          bcrypt.compare(password, result.delete_password, function(err, result) {
            if (result) {
              db.collection('threads').update({_id: reply_id}, {$set: {reply_text: '[deleted]'}}, function(err, result) {
                res.type('text').send('Success!')
              })
            } else {
              res.type('text').send('Incorrect Password')
              return
            }
          })                   
        })
      })
    })
  
    .put(function (req, res) {      
      var reply_id = ObjectId(req.body.reply_id);
      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        db.collection('threads').update({_id: reply_id}, {$set: {reported: 'true'}}, function(err, doc) {
          res.type('text').send('Success!')
        })
      })
    })
};
