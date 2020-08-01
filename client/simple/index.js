/**
 * Copyright 2020 Viero, Inc.
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

'use-strict'

import { shortUId } from '@viero/common/uid';
import { VieroLog } from '@viero/common/log';
import { createElement } from '@viero/ui/utils';
import { VieroWebRTCCommon } from '@viero/webrtc-common';

import { VieroWebRTCSignalingClient } from '@viero/webrtc-signaling-client';
import { VieroWebRTCSFUClient } from "@viero/webrtc-sfu-client";

const urlObj = new URL(location.href);
const channel = urlObj.searchParams.get('channel');
if (!channel) {
  urlObj.searchParams.set('channel', shortUId());
  location.href = urlObj.toString();
}

VieroLog.level = VieroLog.LEVEL.TRACE;

const state = window.vierochat = {};
const me = document.querySelector('#me');
const peers = document.querySelector('#peers');
const chatJoinButton = document.querySelector('#chat-join-button');
const chatLeaveButton = document.querySelector('#chat-leave-button');

chatJoinButton.addEventListener('click', () => {
  if (!VieroWebRTCSFUClient.canCreateUserStream()) {
    return alert('Your browser is missing the required technology for WebRTC!');
  }
  chatJoinButton.setAttribute('disabled', '');
  chatLeaveButton.removeAttribute('disabled');
  state.videochat
    .join(state.signaling)
    .then(() => VieroWebRTCSFUClient.createUserStream({ video: true, audio: true }))
    .then((stream) => state.videochat.setStreams([stream]))
    .then((stream) => createElement('video', { attributes: { playsinline: '', autoplay: '' }, properties: { srcObject: stream, muted: true }, container: me }));
});



chatLeaveButton.addEventListener('click', () => {
  chatJoinButton.removeAttribute('disabled');
  chatLeaveButton.setAttribute('disabled', '');
  state.videochat.leave();
  peers.innerHTML = '';
  state.videochat.setStreams([]);
  me.innerHTML = '';
});

const idBy = (socketId) => {
  return `p${socketId.replace('/', '---').replace('#', '___')}`;
};

state.signaling = new VieroWebRTCSignalingClient('http://localhost:8090', channel);
state.videochat = new VieroWebRTCSFUClient();
state.videochat.addEventListener(VieroWebRTCCommon.EVENT.WEBRTC.STATE_DID_CHANGE, (evt) => {
  console.log(
    `WEBRTC(${evt.detail.direction}).STATE_DID_CHANGE`,
    evt.detail.state, ':', evt.detail.value,
    'in' === evt.detail.direction ? evt.detail.id : `SELF(${evt.detail.id})`,
  );
});
state.videochat.addEventListener(VieroWebRTCCommon.EVENT.PEER.DID_ENTER, (evt) => {
  console.log('PEER.DID_ENTER', evt.detail.peer.socketId);
  createElement('video', { attributes: { id: idBy(evt.detail.peer.socketId), playsinline: '', autoplay: '' }, container: peers });
});
state.videochat.addEventListener(VieroWebRTCCommon.EVENT.PEER.DID_LEAVE, (evt) => {
  console.log('PEER.DID_LEAVE', evt.detail.peer.socketId);
  document.querySelector(`#${idBy(evt.detail.peer.socketId)}`).remove();
});

state.videochat.addEventListener(VieroWebRTCCommon.EVENT.TRACK.DID_ADD, (evt) => {
  console.log('TRACK.DID_ADD', evt.detail.peer.socketId);
  document.querySelector(`#${idBy(evt.detail.peer.socketId)}`).srcObject = evt.detail.peer.stream;
});
state.videochat.addEventListener(VieroWebRTCCommon.EVENT.TRACK.DID_REMOVE, (evt) => {
  console.log('TRACK.DID_REMOVE', evt.detail.peer.socketId);
  document.querySelector(`#${idBy(evt.detail.peer.socketId)}`).srcObject = evt.detail.peer.stream;
});

state.videochat.addEventListener(VieroWebRTCCommon.EVENT.ERROR, (evt) => {
  console.error('ERROR', evt.detail.error, evt.detail.error.userData);
});
