"use strict";

const utils = require("../utils");
const log = require("npmlog");
const { generateOfflineThreadingID } = require("../utils");

module.exports = function(defaultFuncs, api, ctx) {
  return function editMessage(text, messageID, callback) {
    let resolveFunc = function() {};
    let rejectFunc = function() {};
    const returnPromise = new Promise(function(resolve, reject) {
      resolveFunc = resolve;
      rejectFunc = reject;
    });
    
    if (!callback) {
      callback = function(err, data) {
        if (err) {
          return rejectFunc(err);
        }
        resolveFunc(data);
      };
    }
    
    if (!ctx.mqttClient) {
      const error = new Error("Not connected to MQTT");
      log.error("editMessage", error);
      callback(error);
      return returnPromise;
    }
    
    if (typeof text !== "string" || typeof messageID !== "string") {
      const error = new Error("Invalid arguments: text and messageID must be strings");
      log.error("editMessage", error);
      callback(error);
      return returnPromise;
    }
    
    ctx.wsReqNumber = (ctx.wsReqNumber || 0) + 1;
    ctx.wsTaskNumber = (ctx.wsTaskNumber || 0) + 1;
    
    const queryPayload = {
      message_id: messageID,
      text: text
    };
    
    const query = {
      failure_count: null,
      label: "742",
      payload: JSON.stringify(queryPayload),
      queue_name: "edit_message",
      task_id: ctx.wsTaskNumber
    };
    
    const context = {
      app_id: "2220391788200892",
      payload: {
        data_trace_id: null,
        epoch_id: parseInt(generateOfflineThreadingID()),
        tasks: [query],
        version_id: "6903494529735864"
      },
      request_id: ctx.wsReqNumber,
      type: 3
    };
    
    const payloadString = JSON.stringify(context.payload);
    context.payload = payloadString;
    
    ctx.mqttClient.publish("/ls_req", JSON.stringify(context), { qos: 1, retain: false }, function(err) {
      if (err) {
        log.error("editMessage", err);
        return callback(err);
      }
      callback(null);
    });
    
    return returnPromise;
  };
};