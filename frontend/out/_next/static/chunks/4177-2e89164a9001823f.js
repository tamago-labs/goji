"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[4177],{3496:(e,t,r)=>{r.d(t,{e:()=>u});var o=r(48934),n=r(79830);async function i(e,t){let r;if((r="function"==typeof t.connector?e._internal.connectors.setup(t.connector):t.connector).uid===e.state.current)throw new n.nM;try{e.setState(e=>({...e,status:"connecting"})),r.emitter.emit("message",{type:"connecting"});let{connector:o,...n}=t,i=await r.connect(n);return r.emitter.off("connect",e._internal.events.connect),r.emitter.on("change",e._internal.events.change),r.emitter.on("disconnect",e._internal.events.disconnect),await e.storage?.setItem("recentConnectorId",r.id),e.setState(e=>({...e,connections:new Map(e.connections).set(r.uid,{accounts:n.withCapabilities?i.accounts.map(e=>"object"==typeof e?e.address:e):i.accounts,chainId:i.chainId,connector:r}),current:r.uid,status:"connected"})),{accounts:n.withCapabilities?i.accounts.map(e=>"object"==typeof e?e:{address:e,capabilities:{}}):i.accounts,chainId:i.chainId}}catch(t){throw e.setState(e=>({...e,status:e.current?"connected":"disconnected"})),t}}var a=r(12115),s=r(42482);let l=[];function c(e){let t=e.connectors;return l.length===t.length&&l.every((e,r)=>e===t[r])?l:(l=t,t)}function u(e={}){let{mutation:t}=e,r=(0,s.U)(e),n={mutationFn:e=>i(r,e),mutationKey:["connect"]},{mutate:l,mutateAsync:p,...d}=(0,o.n)({...t,...n});return(0,a.useEffect)(()=>r.subscribe(({status:e})=>e,(e,t)=>{"connected"===t&&"disconnected"===e&&d.reset()}),[r,d.reset]),{...d,connect:l,connectAsync:p,connectors:function(e={}){let t=(0,s.U)(e);return(0,a.useSyncExternalStore)(e=>(function(e,t){let{onChange:r}=t;return e._internal.connectors.subscribe((e,t)=>{r(Object.values(e),t)})})(t,{onChange:e}),()=>c(t),()=>c(t))}({config:r})}}},5174:(e,t,r)=>{r.d(t,{A:()=>X});var o,n,i,a,s,l,c,u=function(){return(u=Object.assign||function(e){for(var t,r=1,o=arguments.length;r<o;r++)for(var n in t=arguments[r])Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n]);return e}).apply(this,arguments)};function p(e,t){var r={};for(var o in e)Object.prototype.hasOwnProperty.call(e,o)&&0>t.indexOf(o)&&(r[o]=e[o]);if(null!=e&&"function"==typeof Object.getOwnPropertySymbols)for(var n=0,o=Object.getOwnPropertySymbols(e);n<o.length;n++)0>t.indexOf(o[n])&&Object.prototype.propertyIsEnumerable.call(e,o[n])&&(r[o[n]]=e[o[n]]);return r}var d=("function"==typeof SuppressedError&&SuppressedError,r(12115)),h="right-scroll-bar-position",f="width-before-scroll-bar";function w(e,t){return"function"==typeof e?e(t):e&&(e.current=t),e}var m="u">typeof window?d.useLayoutEffect:d.useEffect,A=new WeakMap,g=(void 0===o&&(o={}),(void 0===n&&(n=function(e){return e}),i=[],a=!1,s={read:function(){if(a)throw Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");return i.length?i[i.length-1]:null},useMedium:function(e){var t=n(e,a);return i.push(t),function(){i=i.filter(function(e){return e!==t})}},assignSyncMedium:function(e){for(a=!0;i.length;){var t=i;i=[],t.forEach(e)}i={push:function(t){return e(t)},filter:function(){return i}}},assignMedium:function(e){a=!0;var t=[];if(i.length){var r=i;i=[],r.forEach(e),t=i}var o=function(){var r=t;t=[],r.forEach(e)},n=function(){return Promise.resolve().then(o)};n(),i={push:function(e){t.push(e),n()},filter:function(e){return t=t.filter(e),i}}}}).options=u({async:!0,ssr:!1},o),s),b=function(){},y=d.forwardRef(function(e,t){var r,o,n,i,a=d.useRef(null),s=d.useState({onScrollCapture:b,onWheelCapture:b,onTouchMoveCapture:b}),l=s[0],c=s[1],h=e.forwardProps,f=e.children,y=e.className,v=e.removeScrollBar,C=e.enabled,x=e.shards,k=e.sideCar,B=e.noRelative,E=e.noIsolation,I=e.inert,Q=e.allowPinchZoom,M=e.as,W=e.gapMode,S=p(e,["forwardProps","children","className","removeScrollBar","enabled","shards","sideCar","noRelative","noIsolation","inert","allowPinchZoom","as","gapMode"]),O=(r=[a,t],o=function(e){return r.forEach(function(t){return w(t,e)})},(n=(0,d.useState)(function(){return{value:null,callback:o,facade:{get current(){return n.value},set current(value){var e=n.value;e!==value&&(n.value=value,n.callback(value,e))}}}})[0]).callback=o,i=n.facade,m(function(){var e=A.get(i);if(e){var t=new Set(e),o=new Set(r),n=i.current;t.forEach(function(e){o.has(e)||w(e,null)}),o.forEach(function(e){t.has(e)||w(e,n)})}A.set(i,r)},[r]),i),R=u(u({},S),l);return d.createElement(d.Fragment,null,C&&d.createElement(k,{sideCar:g,removeScrollBar:v,shards:x,noRelative:B,noIsolation:E,inert:I,setCallbacks:c,allowPinchZoom:!!Q,lockRef:a,gapMode:W}),h?d.cloneElement(d.Children.only(f),u(u({},R),{ref:O})):d.createElement(void 0===M?"div":M,u({},R,{className:y,ref:O}),f))});y.defaultProps={enabled:!0,removeScrollBar:!0,inert:!1},y.classNames={fullWidth:f,zeroRight:h};var v=function(e){var t=e.sideCar,r=p(e,["sideCar"]);if(!t)throw Error("Sidecar: please provide `sideCar` property to import the right car");var o=t.read();if(!o)throw Error("Sidecar medium not found");return d.createElement(o,u({},r))};v.isSideCarExport=!0;var C=function(){var e=0,t=null;return{add:function(o){if(0==e&&(t=function(){if(!document)return null;var e=document.createElement("style");e.type="text/css";var t=c||r.nc;return t&&e.setAttribute("nonce",t),e}())){var n,i;(n=t).styleSheet?n.styleSheet.cssText=o:n.appendChild(document.createTextNode(o)),i=t,(document.head||document.getElementsByTagName("head")[0]).appendChild(i)}e++},remove:function(){--e||!t||(t.parentNode&&t.parentNode.removeChild(t),t=null)}}},x=function(){var e=C();return function(t,r){d.useEffect(function(){return e.add(t),function(){e.remove()}},[t&&r])}},k=function(){var e=x();return function(t){return e(t.styles,t.dynamic),null}},B={left:0,top:0,right:0,gap:0},E=function(e){return parseInt(e||"",10)||0},I=function(e){var t=window.getComputedStyle(document.body),r=t["padding"===e?"paddingLeft":"marginLeft"],o=t["padding"===e?"paddingTop":"marginTop"],n=t["padding"===e?"paddingRight":"marginRight"];return[E(r),E(o),E(n)]},Q=function(e){if(void 0===e&&(e="margin"),"u"<typeof window)return B;var t=I(e),r=document.documentElement.clientWidth,o=window.innerWidth;return{left:t[0],top:t[1],right:t[2],gap:Math.max(0,o-r+t[2]-t[0])}},M=k(),W="data-scroll-locked",S=function(e,t,r,o){var n=e.left,i=e.top,a=e.right,s=e.gap;return void 0===r&&(r="margin"),"\n  .".concat("with-scroll-bars-hidden"," {\n   overflow: hidden ").concat(o,";\n   padding-right: ").concat(s,"px ").concat(o,";\n  }\n  body[").concat(W,"] {\n    overflow: hidden ").concat(o,";\n    overscroll-behavior: contain;\n    ").concat([t&&"position: relative ".concat(o,";"),"margin"===r&&"\n    padding-left: ".concat(n,"px;\n    padding-top: ").concat(i,"px;\n    padding-right: ").concat(a,"px;\n    margin-left:0;\n    margin-top:0;\n    margin-right: ").concat(s,"px ").concat(o,";\n    "),"padding"===r&&"padding-right: ".concat(s,"px ").concat(o,";")].filter(Boolean).join(""),"\n  }\n  \n  .").concat(h," {\n    right: ").concat(s,"px ").concat(o,";\n  }\n  \n  .").concat(f," {\n    margin-right: ").concat(s,"px ").concat(o,";\n  }\n  \n  .").concat(h," .").concat(h," {\n    right: 0 ").concat(o,";\n  }\n  \n  .").concat(f," .").concat(f," {\n    margin-right: 0 ").concat(o,";\n  }\n  \n  body[").concat(W,"] {\n    ").concat("--removed-body-scroll-bar-size",": ").concat(s,"px;\n  }\n")},O=function(){var e=parseInt(document.body.getAttribute(W)||"0",10);return isFinite(e)?e:0},R=function(){d.useEffect(function(){return document.body.setAttribute(W,(O()+1).toString()),function(){var e=O()-1;e<=0?document.body.removeAttribute(W):document.body.setAttribute(W,e.toString())}},[])},F=function(e){var t=e.noRelative,r=e.noImportant,o=e.gapMode,n=void 0===o?"margin":o;R();var i=d.useMemo(function(){return Q(n)},[n]);return d.createElement(M,{styles:S(i,!t,n,r?"":"!important")})},D=!1;if("u">typeof window)try{var N=Object.defineProperty({},"passive",{get:function(){return D=!0,!0}});window.addEventListener("test",N,N),window.removeEventListener("test",N,N)}catch(e){D=!1}var T=!!D&&{passive:!1},P=function(e,t){if(!(e instanceof Element))return!1;var r=window.getComputedStyle(e);return"hidden"!==r[t]&&(r.overflowY!==r.overflowX||"TEXTAREA"===e.tagName||"visible"!==r[t])},L=function(e,t){var r=t.ownerDocument,o=t;do{if("u">typeof ShadowRoot&&o instanceof ShadowRoot&&(o=o.host),U(e,o)){var n=q(e,o);if(n[1]>n[2])return!0}o=o.parentNode}while(o&&o!==r.body);return!1},U=function(e,t){return"v"===e?P(t,"overflowY"):P(t,"overflowX")},q=function(e,t){return"v"===e?[t.scrollTop,t.scrollHeight,t.clientHeight]:[t.scrollLeft,t.scrollWidth,t.clientWidth]},j=function(e,t,r,o,n){var i,a=(i=window.getComputedStyle(t).direction,"h"===e&&"rtl"===i?-1:1),s=a*o,l=r.target,c=t.contains(l),u=!1,p=s>0,d=0,h=0;do{if(!l)break;var f=q(e,l),w=f[0],m=f[1]-f[2]-a*w;(w||m)&&U(e,l)&&(d+=m,h+=w);var A=l.parentNode;l=A&&A.nodeType===Node.DOCUMENT_FRAGMENT_NODE?A.host:A}while(!c&&l!==document.body||c&&(t.contains(l)||t===l));return p&&(n&&1>Math.abs(d)||!n&&s>d)?u=!0:!p&&(n&&1>Math.abs(h)||!n&&-s>h)&&(u=!0),u},G=function(e){return"changedTouches"in e?[e.changedTouches[0].clientX,e.changedTouches[0].clientY]:[0,0]},J=function(e){return[e.deltaX,e.deltaY]},K=function(e){return e&&"current"in e?e.current:e},H=0,V=[];let z=(l=function(e){var t=d.useRef([]),r=d.useRef([0,0]),o=d.useRef(),n=d.useState(H++)[0],i=d.useState(k)[0],a=d.useRef(e);d.useEffect(function(){a.current=e},[e]),d.useEffect(function(){if(e.inert){document.body.classList.add("block-interactivity-".concat(n));var t=(function(e,t,r){if(r||2==arguments.length)for(var o,n=0,i=t.length;n<i;n++)!o&&n in t||(o||(o=Array.prototype.slice.call(t,0,n)),o[n]=t[n]);return e.concat(o||Array.prototype.slice.call(t))})([e.lockRef.current],(e.shards||[]).map(K),!0).filter(Boolean);return t.forEach(function(e){return e.classList.add("allow-interactivity-".concat(n))}),function(){document.body.classList.remove("block-interactivity-".concat(n)),t.forEach(function(e){return e.classList.remove("allow-interactivity-".concat(n))})}}},[e.inert,e.lockRef.current,e.shards]);var s=d.useCallback(function(e,t){if("touches"in e&&2===e.touches.length||"wheel"===e.type&&e.ctrlKey)return!a.current.allowPinchZoom;var n,i=G(e),s=r.current,l="deltaX"in e?e.deltaX:s[0]-i[0],c="deltaY"in e?e.deltaY:s[1]-i[1],u=e.target,p=Math.abs(l)>Math.abs(c)?"h":"v";if("touches"in e&&"h"===p&&"range"===u.type)return!1;var d=window.getSelection(),h=d&&d.anchorNode;if(h&&(h===u||h.contains(u)))return!1;var f=L(p,u);if(!f)return!0;if(f?n=p:(n="v"===p?"h":"v",f=L(p,u)),!f)return!1;if(!o.current&&"changedTouches"in e&&(l||c)&&(o.current=n),!n)return!0;var w=o.current||n;return j(w,t,e,"h"===w?l:c,!0)},[]),l=d.useCallback(function(e){if(V.length&&V[V.length-1]===i){var r="deltaY"in e?J(e):G(e),o=t.current.filter(function(t){var o;return t.name===e.type&&(t.target===e.target||e.target===t.shadowParent)&&(o=t.delta,o[0]===r[0]&&o[1]===r[1])})[0];if(o&&o.should){e.cancelable&&e.preventDefault();return}if(!o){var n=(a.current.shards||[]).map(K).filter(Boolean).filter(function(t){return t.contains(e.target)});(n.length>0?s(e,n[0]):!a.current.noIsolation)&&e.cancelable&&e.preventDefault()}}},[]),c=d.useCallback(function(e,r,o,n){var i={name:e,delta:r,target:o,should:n,shadowParent:function(e){for(var t=null;null!==e;)e instanceof ShadowRoot&&(t=e.host,e=e.host),e=e.parentNode;return t}(o)};t.current.push(i),setTimeout(function(){t.current=t.current.filter(function(e){return e!==i})},1)},[]),u=d.useCallback(function(e){r.current=G(e),o.current=void 0},[]),p=d.useCallback(function(t){c(t.type,J(t),t.target,s(t,e.lockRef.current))},[]),h=d.useCallback(function(t){c(t.type,G(t),t.target,s(t,e.lockRef.current))},[]);d.useEffect(function(){return V.push(i),e.setCallbacks({onScrollCapture:p,onWheelCapture:p,onTouchMoveCapture:h}),document.addEventListener("wheel",l,T),document.addEventListener("touchmove",l,T),document.addEventListener("touchstart",u,T),function(){V=V.filter(function(e){return e!==i}),document.removeEventListener("wheel",l,T),document.removeEventListener("touchmove",l,T),document.removeEventListener("touchstart",u,T)}},[]);var f=e.removeScrollBar,w=e.inert;return d.createElement(d.Fragment,null,w?d.createElement(i,{styles:"\n  .block-interactivity-".concat(n," {pointer-events: none;}\n  .allow-interactivity-").concat(n," {pointer-events: all;}\n")}):null,f?d.createElement(F,{noRelative:e.noRelative,gapMode:e.gapMode}):null)},g.useMedium(l),v);var Y=d.forwardRef(function(e,t){return d.createElement(y,u({},e,{ref:t,sideCar:z}))});Y.classNames=y.classNames;let X=Y},8599:(e,t,r)=>{function o(e){var t=e.match(/^var\((.*)\)$/);return t?t[1]:e}function n(e,t){var r={};if("object"==typeof t)!function e(t,r){var o=arguments.length>2&&void 0!==arguments[2]?arguments[2]:[],n={};for(var i in t){var a=t[i],s=[...o,i];"string"==typeof a||"number"==typeof a||null==a?n[i]=r(a,s):"object"!=typeof a||Array.isArray(a)?console.warn('Skipping invalid key "'.concat(s.join("."),'". Should be a string, number, null or object. Received: "').concat(Array.isArray(a)?"Array":typeof a,'"')):n[i]=e(a,r,s)}return n}(t,(t,n)=>{null!=t&&(r[o(function(e,t){var r=e;for(var o of t){if(!(o in r))throw Error("Path ".concat(t.join(" -> ")," does not exist in object"));r=r[o]}return r}(e,n))]=String(t))});else for(var n in e){var i=e[n];null!=i&&(r[o(n)]=i)}return Object.defineProperty(r,"toString",{value:function(){return Object.keys(this).map(e=>"".concat(e,":").concat(this[e])).join(";")},writable:!1}),r}r.d(t,{D:()=>n})},11493:(e,t,r)=>{r.d(t,{_:()=>a});var o=r(41372),n={blue:{accentColor:"#0E76FD",accentColorForeground:"#FFF"},green:{accentColor:"#1DB847",accentColorForeground:"#FFF"},orange:{accentColor:"#FF801F",accentColorForeground:"#FFF"},pink:{accentColor:"#FF5CA0",accentColorForeground:"#FFF"},purple:{accentColor:"#5F5AFA",accentColorForeground:"#FFF"},red:{accentColor:"#FA423C",accentColorForeground:"#FFF"}},i=n.blue,a=({accentColor:e=i.accentColor,accentColorForeground:t=i.accentColorForeground,...r}={})=>({...(0,o.$)(r),colors:{accentColor:e,accentColorForeground:t,actionButtonBorder:"rgba(0, 0, 0, 0.04)",actionButtonBorderMobile:"rgba(0, 0, 0, 0.06)",actionButtonSecondaryBackground:"rgba(0, 0, 0, 0.06)",closeButton:"rgba(60, 66, 66, 0.8)",closeButtonBackground:"rgba(0, 0, 0, 0.06)",connectButtonBackground:"#FFF",connectButtonBackgroundError:"#FF494A",connectButtonInnerBackground:"linear-gradient(0deg, rgba(0, 0, 0, 0.03), rgba(0, 0, 0, 0.06))",connectButtonText:"#25292E",connectButtonTextError:"#FFF",connectionIndicator:"#30E000",downloadBottomCardBackground:"linear-gradient(126deg, rgba(255, 255, 255, 0) 9.49%, rgba(171, 171, 171, 0.04) 71.04%), #FFFFFF",downloadTopCardBackground:"linear-gradient(126deg, rgba(171, 171, 171, 0.2) 9.49%, rgba(255, 255, 255, 0) 71.04%), #FFFFFF",error:"#FF494A",generalBorder:"rgba(0, 0, 0, 0.06)",generalBorderDim:"rgba(0, 0, 0, 0.03)",menuItemBackground:"rgba(60, 66, 66, 0.1)",modalBackdrop:"rgba(0, 0, 0, 0.3)",modalBackground:"#FFF",modalBorder:"transparent",modalText:"#25292E",modalTextDim:"rgba(60, 66, 66, 0.3)",modalTextSecondary:"rgba(60, 66, 66, 0.6)",profileAction:"#FFF",profileActionHover:"rgba(255, 255, 255, 0.5)",profileForeground:"rgba(60, 66, 66, 0.06)",selectedOptionBorder:"rgba(60, 66, 66, 0.1)",standby:"#FFD641"},shadows:{connectButton:"0px 4px 12px rgba(0, 0, 0, 0.1)",dialog:"0px 8px 32px rgba(0, 0, 0, 0.32)",profileDetailsAction:"0px 2px 6px rgba(37, 41, 46, 0.04)",selectedOption:"0px 2px 6px rgba(0, 0, 0, 0.24)",selectedWallet:"0px 2px 6px rgba(0, 0, 0, 0.12)",walletLogo:"0px 2px 16px rgba(0, 0, 0, 0.16)"}});a.accentColors=n},18120:(e,t,r)=>{let o,n,i,a,s,l,c,u,p,d,h,f,w,m,A;r.d(t,{S:()=>H});let g=new Map([[8217,"apostrophe"],[8260,"fraction slash"],[12539,"middle dot"]]);function b(e){var t;let r;return t=function(e){let t=0;function r(){return e[t++]<<8|e[t++]}let o=r(),n=1,i=[0,1];for(let e=1;e<o;e++)i.push(n+=r());let a=r(),s=t;t+=a;let l=0,c=0;function u(){return 0==l&&(c=c<<8|e[t++],l=8),c>>--l&1}let p=0x80000000-1,d=0;for(let e=0;e<31;e++)d=d<<1|u();let h=[],f=0,w=0x80000000;for(;;){let e=Math.floor(((d-f+1)*n-1)/w),t=0,r=o;for(;r-t>1;){let o=t+r>>>1;e<i[o]?r=o:t=o}if(0==t)break;h.push(t);let a=f+Math.floor(w*i[t]/n),s=f+Math.floor(w*i[t+1]/n)-1;for(;((a^s)&0x40000000)==0;)d=d<<1&p|u(),a=a<<1&p,s=s<<1&p|1;for(;a&~s&0x20000000;)d=0x40000000&d|d<<1&p>>>1|u(),a=a<<1^0x40000000,s=(0x40000000^s)<<1|0x40000001;f=a,w=1+s-a}let m=o-4;return h.map(t=>{switch(t-m){case 3:return m+65792+(e[s++]<<16|e[s++]<<8|e[s++]);case 2:return m+256+(e[s++]<<8|e[s++]);case 1:return m+e[s++];default:return t-1}})}(function(e){let t=[];[..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"].forEach((e,r)=>t[e.charCodeAt(0)]=r);let r=e.length,o=new Uint8Array(6*r>>3);for(let n=0,i=0,a=0,s=0;n<r;n++)s=s<<6|t[e.charCodeAt(n)],(a+=6)>=8&&(o[i++]=s>>(a-=8));return o}(e)),r=0,()=>t[r++]}function y(e,t=0){let r=[];for(;;){let o=e(),n=e();if(!n)break;t+=o;for(let e=0;e<n;e++)r.push(t+e);t+=n+1}return r}function v(e){return x(()=>{let t=y(e);if(t.length)return t})}function C(e){let t=[];for(;;){let r=e();if(0==r)break;t.push(function(e,t){let r=1+t(),o=t(),n=x(t);return k(n.length,1+e,t).flatMap((e,t)=>{let[i,...a]=e;return Array(n[t]).fill().map((e,t)=>{let n=t*o;return[i+t*r,a.map(e=>e+n)]})})}(r,e))}for(;;){var r,o;let n=e()-1;if(n<0)break;t.push((r=n,k(1+(o=e)(),1+r,o).map(e=>[e[0],e.slice(1)])))}return t.flat()}function x(e){let t=[];for(;;){let r=e(t.length);if(!r)break;t.push(r)}return t}function k(e,t,r){let o=Array(e).fill().map(()=>[]);for(let n=0;n<t;n++)(function(e,t){let r=Array(e);for(let n=0,i=0;n<e;n++){var o;r[n]=i+=1&(o=t())?~o>>1:o>>1}return r})(e,r).forEach((e,t)=>o[t].push(e));return o}function B(e){return`{${e.toString(16).toUpperCase().padStart(2,"0")}}`}function E(e){let t=e.length;if(t<4096)return String.fromCodePoint(...e);let r=[];for(let o=0;o<t;)r.push(String.fromCodePoint(...e.slice(o,o+=4096)));return r.join("")}function I(e,t){let r=e.length,o=r-t.length;for(let n=0;0==o&&n<r;n++)o=e[n]-t[n];return o}let Q=55204;function M(e){return e>>24&255}function W(e){return 0xffffff&e}function S(e){return e>=44032&&e<Q}function O(e){o||function(){let e=b("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");for(let[t,r]of(o=new Map(v(e).flatMap((e,t)=>e.map(e=>[e,t+1<<24]))),n=new Set(y(e)),i=new Map,a=new Map,C(e))){if(!n.has(t)&&2==r.length){let[e,o]=r,n=a.get(e);n||(n=new Map,a.set(e,n)),n.set(o,t)}i.set(t,r.reverse())}}();let t=[],r=[],s=!1;function l(e){let r=o.get(e);r&&(s=!0,e|=r),t.push(e)}for(let o of e)for(;;){if(o<128)t.push(o);else if(S(o)){let e=o-44032,t=e/588|0,r=e%588/28|0,n=e%28;l(4352+t),l(4449+r),n>0&&l(4519+n)}else{let e=i.get(o);e?r.push(...e):l(o)}if(!r.length)break;o=r.pop()}if(s&&t.length>1){let e=M(t[0]);for(let r=1;r<t.length;r++){let o=M(t[r]);if(0==o||e<=o){e=o;continue}let n=r-1;for(;;){let r=t[n+1];if(t[n+1]=t[n],t[n]=r,!n||(e=M(t[--n]))<=o)break}e=M(t[r])}}return t}function R(e){return function(e){let t=[],r=[],o=-1,n=0;for(let i of e){let e=M(i),s=W(i);if(-1==o)0==e?o=s:t.push(s);else if(n>0&&n>=e)0==e?(t.push(o,...r),r.length=0,o=s):r.push(s),n=e;else{let i=function(e,t){if(e>=4352&&e<4371&&t>=4449&&t<4470)return 44032+(e-4352)*588+(t-4449)*28;{if(S(e)&&t>4519&&t<4547&&(e-44032)%28==0)return e+(t-4519);let r=a.get(e);return r&&(r=r.get(t))?r:-1}}(o,s);i>=0?o=i:0==n&&0==e?(t.push(o),o=s):(r.push(s),n=e)}}return o>=0&&t.push(o,...r),t}(O(e))}let F=e=>Array.from(e);function D(e,t){return e.P.has(t)||e.Q.has(t)}class N extends Array{get is_emoji(){return!0}}function T(){let e,t;if(s)return;let r=b("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"),o=()=>new Set(y(r)),n=(e,t)=>t.forEach(t=>e.add(t));s=new Map(C(r)),l=o(),c=y(r),u=new Set(y(r).map(e=>c[e])),c=new Set(c),p=o(),o();let i=v(r),a=r(),g=()=>{let e=new Set;return y(r).forEach(t=>n(e,i[t])),n(e,y(r)),e};d=x(e=>{let t=x(r).map(e=>e+96);if(t.length){let o=e>=a;t[0]-=32,t=E(t),o&&(t=`Restricted[${t}]`);let n=g();return{N:t,P:n,Q:g(),M:!r(),R:o}}}),h=o(),f=new Map;let k=y(r).concat(F(h)).sort((e,t)=>e-t);for(let{V:e,M:t}of(k.forEach((e,t)=>{let o=r(),n=k[t]=o?k[t-o]:{V:[],M:new Map};n.V.push(e),h.has(e)||f.set(e,n)}),new Set(f.values()))){let r=[];for(let t of e){let e=d.filter(e=>D(e,t)),o=r.find(({G:t})=>e.some(e=>t.has(e)));o||(o={G:new Set,V:[]},r.push(o)),o.V.push(t),n(o.G,e)}let o=r.flatMap(e=>F(e.G));for(let{G:e,V:n}of r){let r=new Set(o.filter(t=>!e.has(t)));for(let e of n)t.set(e,r)}}w=new Set;let B=new Set,Q=e=>w.has(e)?B.add(e):w.add(e);for(let e of d){for(let t of e.P)Q(t);for(let t of e.Q)Q(t)}for(let e of w)f.has(e)||B.has(e)||f.set(e,1);for(let o of(n(w,O(w).map(W)),m=(e=[],t=y(r),function t({S:r,B:o},n,i){if(!(4&r)||i!==n[n.length-1])for(let a of(2&r&&(i=n[n.length-1]),1&r&&e.push(n),o))for(let e of a.Q)t(a,[...n,e],i)}(function e(o){return{S:r(),B:x(()=>{let o=y(r).map(e=>t[e]);if(o.length)return e(o)}),Q:o}}([]),[]),e).map(e=>N.from(e)).sort(I),A=new Map,m)){let e=[A];for(let t of o){let r=e.map(e=>{let r=e.get(t);return r||(r=new Map,e.set(t,r)),r});65039===t?e.push(...r):e=r}for(let t of e)t.V=o}}function P(e){return(q(e)?"":`${L(U([e]))} `)+B(e)}function L(e){return`"${e}"\u200E`}function U(e,t=1/0,r=B){var o;let n=[];o=e[0],T(),c.has(o)&&n.push("◌"),e.length>t&&(t>>=1,e=[...e.slice(0,t),8230,...e.slice(-t)]);let i=0,a=e.length;for(let t=0;t<a;t++){let o=e[t];q(o)&&(n.push(E(e.slice(i,t))),n.push(r(o)),i=t+1)}return n.push(E(e.slice(i,a))),n.join("")}function q(e){return T(),p.has(e)}function j(e){return Error(`disallowed character: ${P(e)}`)}function G(e,t){let r=P(t),o=d.find(e=>e.P.has(t));return o&&(r=`${o.N} ${r}`),Error(`illegal mixture: ${e.N} + ${r}`)}function J(e){return Error(`illegal placement: ${e}`)}function K(e){return e.filter(e=>65039!=e)}function H(e){var t=function(e,t,r){if(!e)return[];T();let o=0;return e.split(".").map(e=>{let n=function(e){let t=[];for(let r=0,o=e.length;r<o;){let o=e.codePointAt(r);r+=o<65536?1:2,t.push(o)}return t}(e),i={input:n,offset:o};o+=n.length+1;try{let e,o=i.tokens=function(e,t,r){let o=[],n=[];for(e=e.slice().reverse();e.length;){let i=function(e){let t,r=A,o=e.length;for(;o&&(r=r.get(e[--o]));){let{V:n}=r;n&&(t=n,e.length=o)}return t}(e);if(i)n.length&&(o.push(t(n)),n=[]),o.push(r(i));else{let t=e.pop();if(w.has(t))n.push(t);else{let e=s.get(t);if(e)n.push(...e);else if(!l.has(t))throw j(t)}}}return n.length&&o.push(t(n)),o}(n,t,r),a=o.length;if(!a)throw Error("empty label");let p=i.output=o.flat();for(let e=p.lastIndexOf(95);e>0;)if(95!==p[--e])throw Error("underscore allowed only at start");if(!(i.emoji=a>1||o[0].is_emoji)&&p.every(e=>e<128)){if(p.length>=4&&45==p[2]&&45==p[3])throw Error(`invalid label extension: "${E(p.slice(0,4))}"`);e="ASCII"}else{let t=o.flatMap(e=>e.is_emoji?[]:e);if(t.length){if(c.has(p[0]))throw J("leading combining mark");for(let e=1;e<a;e++){let t=o[e];if(!t.is_emoji&&c.has(t[0]))throw J(`emoji + combining mark: "${E(o[e-1])} + ${U([t[0]])}"`)}!function(e){let t=e[0],r=g.get(t);if(r)throw J(`leading ${r}`);let o=e.length,n=-1;for(let i=1;i<o;i++){t=e[i];let o=g.get(t);if(o){if(n==i)throw J(`${r} + ${o}`);n=i+1,r=o}}if(n==o)throw J(`trailing ${r}`)}(p);let r=F(new Set(t)),[n]=function(e){let t=d;for(let r of e){let e=t.filter(e=>D(e,r));if(!e.length)if(d.some(e=>D(e,r)))throw G(t[0],r);else throw j(r);if(t=e,1==e.length)break}return t}(r);(function(e,t){for(let r of t)if(!D(e,r))throw G(e,r);if(e.M){let e=O(t).map(W);for(let t=1,r=e.length;t<r;t++)if(u.has(e[t])){let o=t+1;for(let n;o<r&&u.has(n=e[o]);o++)for(let r=t;r<o;r++)if(e[r]==n)throw Error(`duplicate non-spacing marks: ${P(n)}`);if(o-t>4)throw Error(`excessive non-spacing marks: ${L(U(e.slice(t-1,o)))} (${o-t}/4)`);t=o}}})(n,t),function(e,t){let r,o=[];for(let e of t){let t=f.get(e);if(1===t)return;if(t){let o=t.M.get(e);if(!(r=r?r.filter(e=>o.has(e)):F(o)).length)return}else o.push(e)}if(r){for(let t of r)if(o.every(e=>D(t,e)))throw Error(`whole-script confusable: ${e.N}/${t.N}`)}}(n,r),e=n.N}else e="Emoji"}i.type=e}catch(e){i.error=e}return i})}(e,R,K);return t.map(({input:e,error:r,output:o})=>{if(r){let o=r.message;throw Error(1==t.length?o:`Invalid label ${L(U(e,63))}: ${o}`)}return E(o)}).join(".")}},18138:(e,t,r)=>{r.d(t,{A:()=>v});var o=r(94747),n=r(12581),i=r(49235),a=r(53548),s=r(64200);let l={ether:-18,gwei:-9};function c(e){return"number"==typeof e?e:"wei"===e?0:Math.abs(l[e])}var u=r(78568),p=r(42417);async function d(e,t){let{allowFailure:r=!0,chainId:o,contracts:n,...i}=t,a=e.getClient({chainId:o});return(0,s.T)(a,p.C,"multicall")({allowFailure:r,contracts:n,...i})}var h=r(27854);async function f(e,t){let{allowFailure:r=!0,blockNumber:o,blockTag:n,...i}=t,a=t.contracts;try{let t={};for(let[r,o]of a.entries()){let n=o.chainId??e.state.chainId;t[n]||(t[n]=[]),t[n]?.push({contract:o,index:r})}let s=(await Promise.all(Object.entries(t).map(([t,a])=>d(e,{...i,allowFailure:r,blockNumber:o,blockTag:n,chainId:Number.parseInt(t,10),contracts:a.map(({contract:e})=>e)})))).flat(),l=Object.values(t).flatMap(e=>e.map(({index:e})=>e));return s.reduce((e,t,r)=>(e&&(e[l[r]]=t),e),[])}catch(i){if(i instanceof u.bG)throw i;let t=()=>a.map(t=>(function(e,t){let{chainId:r,...o}=t,n=e.getClient({chainId:r});return(0,s.T)(n,h.J,"readContract")(o)})(e,{...t,blockNumber:o,blockTag:n}));if(r)return(await Promise.allSettled(t())).map(e=>"fulfilled"===e.status?{result:e.value,status:"success"}:{error:e.reason,result:void 0,status:"failure"});return await Promise.all(t())}}async function w(e,t){let{address:r,blockNumber:l,blockTag:u,chainId:p,token:d,unit:h="ether"}=t;if(d)try{return await m(e,{balanceAddress:r,chainId:p,symbolType:"string",tokenAddress:d})}catch(t){if("ContractFunctionExecutionError"===t.name){let t=await m(e,{balanceAddress:r,chainId:p,symbolType:"bytes32",tokenAddress:d}),i=(0,o.IQ)((0,n.B)(t.symbol,{dir:"right"}));return{...t,symbol:i}}throw t}let f=e.getClient({chainId:p}),w=(0,s.T)(f,a.r,"getBalance"),A=await w(l?{address:r,blockNumber:l}:{address:r,blockTag:u}),g=e.chains.find(e=>e.id===p)??f.chain;return{decimals:g.nativeCurrency.decimals,formatted:(0,i.J)(A,c(h)),symbol:g.nativeCurrency.symbol,value:A}}async function m(e,t){let{balanceAddress:r,chainId:o,symbolType:n,tokenAddress:a,unit:s}=t,l={abi:[{type:"function",name:"balanceOf",stateMutability:"view",inputs:[{type:"address"}],outputs:[{type:"uint256"}]},{type:"function",name:"decimals",stateMutability:"view",inputs:[],outputs:[{type:"uint8"}]},{type:"function",name:"symbol",stateMutability:"view",inputs:[],outputs:[{type:n}]}],address:a},[u,p,d]=await f(e,{allowFailure:!1,contracts:[{...l,functionName:"balanceOf",args:[r],chainId:o},{...l,functionName:"decimals",chainId:o},{...l,functionName:"symbol",chainId:o}]}),h=(0,i.J)(u??"0",c(s??p));return{decimals:p,formatted:h,symbol:d,value:u}}var A=r(72242),g=r(47002),b=r(5573),y=r(42482);function v(e={}){let{address:t,query:r={}}=e,o=(0,y.U)(e),n=(0,b.i)({config:o}),i=function(e,t={}){return{async queryFn({queryKey:t}){let{address:r,scopeKey:o,...n}=t[1];if(!r)throw Error("address is required");return await w(e,{...n,address:r})??null},queryKey:function(e={}){return["balance",(0,A.xO)(e)]}(t)}}(o,{...e,chainId:e.chainId??n}),a=!!(t&&(r.enabled??!0));return(0,g.IT)({...r,...i,enabled:a})}},23047:(e,t,r)=>{r.d(t,{R:()=>d});var o=r(48934),n=r(79830),i=r(87403);async function a(e,t){let{addEthereumChainParameter:r,chainId:o}=t,a=e.state.connections.get(t.connector?.uid??e.state.current);if(a){let e=a.connector;if(!e.switchChain)throw new i.V({connector:e});return await e.switchChain({addEthereumChainParameter:r,chainId:o})}let s=e.chains.find(e=>e.id===o);if(!s)throw new n.nk;return e.setState(e=>({...e,chainId:o})),s}var s=r(1220);let l=[];function c(e){let t=e.chains;return(0,s.b)(l,t)?l:(l=t,t)}var u=r(12115),p=r(42482);function d(e={}){let{mutation:t}=e,r=(0,p.U)(e),n={mutationFn:e=>a(r,e),mutationKey:["switchChain"]},{mutate:i,mutateAsync:s,...l}=(0,o.n)({...t,...n});return{...l,chains:function(e={}){let t=(0,p.U)(e);return(0,u.useSyncExternalStore)(e=>(function(e,t){let{onChange:r}=t;return e._internal.chains.subscribe((e,t)=>{r(e,t)})})(t,{onChange:e}),()=>c(t),()=>c(t))}({config:r}),switchChain:i,switchChainAsync:s}}},28850:(e,t,r)=>{r.d(t,{O:()=>ej});var o,n="user-agent",i="function",a="object",s="string",l="undefined",c="browser",u="device",p="engine",d="result",h="name",f="type",w="vendor",m="version",A="architecture",g="major",b="model",y="console",v="mobile",C="tablet",x="smarttv",k="wearable",B="embedded",E="inapp",I="brands",Q="formFactors",M="fullVersionList",W="platform",S="platformVersion",O="bitness",R="sec-ch-ua",F=R+"-full-version-list",D=R+"-arch",N=R+"-"+O,T=R+"-form-factors",P=R+"-"+v,L=R+"-"+b,U=R+"-"+W,q=U+"-version",j=[I,M,v,b,W,S,A,Q,O],G="Amazon",J="Apple",K="ASUS",H="BlackBerry",V="Google",z="Huawei",Y="Lenovo",X="Honor",Z="Microsoft",_="Motorola",$="Nvidia",ee="OnePlus",et="OPPO",er="Samsung",eo="Sharp",en="Sony",ei="Xiaomi",ea="Zebra",es="Chrome",el="Chromium",ec="Chromecast",eu="Edge",ep="Firefox",ed="Opera",eh="Facebook",ef="Sogou",ew="Mobile ",em=" Browser",eA="Windows",eg=typeof window!==l&&window.navigator?window.navigator:void 0,eb=eg&&eg.userAgentData?eg.userAgentData:void 0,ey=function(e,t){var r={},o=t;if(!ex(t))for(var n in o={},t)for(var i in t[n])o[i]=t[n][i].concat(o[i]?o[i]:[]);for(var a in e)r[a]=o[a]&&o[a].length%2==0?o[a].concat(e[a]):e[a];return r},ev=function(e){for(var t={},r=0;r<e.length;r++)t[e[r].toUpperCase()]=e[r];return t},eC=function(e,t){if(typeof e===a&&e.length>0){for(var r in e)if(eE(t)==eE(e[r]))return!0;return!1}return!!ek(e)&&eE(t)==eE(e)},ex=function(e,t){for(var r in e)return/^(browser|cpu|device|engine|os)$/.test(r)||!!t&&ex(e[r])},ek=function(e){return typeof e===s},eB=function(e){if(e){for(var t=[],r=eQ(e).split(","),o=0;o<r.length;o++)if(r[o].indexOf(";")>-1){var n=eS(r[o]).split(";v=");t[o]={brand:n[0],version:n[1]}}else t[o]=eS(r[o]);return t}},eE=function(e){return ek(e)?e.toLowerCase():e},eI=function(e){return ek(e)?eW(/[^\d\.]/g,e).split(".")[0]:void 0},eQ=function(e){return ek(e)?eS(eW(/\\?\"/g,e),500):void 0},eM=function(e){for(var t in e)if(e.hasOwnProperty(t)){var r=e[t];typeof r==a&&2==r.length?this[r[0]]=r[1]:this[r]=void 0}return this},eW=function(e,t){return ek(t)?t.replace(e,""):t},eS=function(e,t){return e=eW(/^\s\s*/,String(e)),typeof t===l?e:e.substring(0,t)},eO=function(e,t){if(e&&t)for(var r,o,n,s,l,c,u=0;u<t.length&&!l;){var p=t[u],d=t[u+1];for(r=o=0;r<p.length&&!l&&p[r];)if(l=p[r++].exec(e))for(n=0;n<d.length;n++)c=l[++o],typeof(s=d[n])===a&&s.length>0?2===s.length?typeof s[1]==i?this[s[0]]=s[1].call(this,c):this[s[0]]=s[1]:s.length>=3&&(typeof s[1]!==i||s[1].exec&&s[1].test?3==s.length?this[s[0]]=c?c.replace(s[1],s[2]):void 0:4==s.length?this[s[0]]=c?s[3].call(this,c.replace(s[1],s[2])):void 0:s.length>4&&(this[s[0]]=c?s[3].apply(this,[c.replace(s[1],s[2])].concat(s.slice(4))):void 0):s.length>3?this[s[0]]=c?s[1].apply(this,s.slice(2)):void 0:this[s[0]]=c?s[1].call(this,c,s[2]):void 0):this[s]=c||void 0;u+=2}},eR=function(e,t){for(var r in t)if(typeof t[r]===a&&t[r].length>0){for(var o=0;o<t[r].length;o++)if(eC(t[r][o],e))return"?"===r?void 0:r}else if(eC(t[r],e))return"?"===r?void 0:r;return t.hasOwnProperty("*")?t["*"]:e},eF={ME:"4.90","NT 3.51":"3.51","NT 4.0":"4.0",2e3:["5.0","5.01"],XP:["5.1","5.2"],Vista:"6.0",7:"6.1",8:"6.2","8.1":"6.3",10:["6.4","10.0"],NT:""},eD={embedded:"Automotive",mobile:"Mobile",tablet:["Tablet","EInk"],smarttv:"TV",wearable:"Watch",xr:["VR","XR"],"?":["Desktop","Unknown"],"*":void 0},eN={Chrome:"Google Chrome",Edge:"Microsoft Edge","Edge WebView2":"Microsoft Edge WebView2","Chrome WebView":"Android WebView","Chrome Headless":"HeadlessChrome","Huawei Browser":"HuaweiBrowser","MIUI Browser":"Miui Browser","Opera Mobi":"OperaMobile",Yandex:"YaBrowser"},eT={browser:[[/\b(?:crmo|crios)\/([\w\.]+)/i],[m,[h,ew+"Chrome"]],[/webview.+edge\/([\w\.]+)/i],[m,[h,eu+" WebView"],[f,E]],[/edg(?:e|ios|a)?\/([\w\.]+)/i],[m,[h,"Edge"]],[/(opera mini)\/([-\w\.]+)/i,/(opera [mobiletab]{3,6})\b.+version\/([-\w\.]+)/i,/(opera)(?:.+version\/|[\/ ]+)([\w\.]+)/i],[h,m],[/opios[\/ ]+([\w\.]+)/i],[m,[h,ed+" Mini"]],[/\bop(?:rg)?x\/([\w\.]+)/i],[m,[h,ed+" GX"]],[/\bopr\/([\w\.]+)/i],[m,[h,ed]],[/\bb[ai]*d(?:uhd|[ub]*[aekoprswx]{5,6})[\/ ]?([\w\.]+)/i],[m,[h,"Baidu"]],[/\b(?:mxbrowser|mxios|myie2)\/?([-\w\.]*)\b/i],[m,[h,"Maxthon"]],[/(kindle)\/([\w\.]+)/i,/(lunascape|maxthon|netfront|jasmine|blazer|sleipnir)[\/ ]?([\w\.]*)/i,/(avant|iemobile|slim(?:browser|boat|jet))[\/ ]?([\d\.]*)/i,/(?:ms|\()(ie) ([\w\.]+)/i,/(atlas|flock|rockmelt|midori|epiphany|silk|skyfire|bolt|iron|vivaldi|iridium|phantomjs|bowser|qupzilla|falkon|rekonq|puffin|whale(?!.+naver)|qqbrowserlite|duckduckgo|klar|helio|(?=comodo_)?dragon|otter|dooble|(?:hi|lg |ovi|qute)browser|palemoon)\/v?([-\w\.]+)/i,/(brave)(?: chrome)?\/([\d\.]+)/i,/(aloha|heytap|ovi|115|surf|qwant)browser\/([\d\.]+)/i,/(qwant)(?:ios|mobile)\/([\d\.]+)/i,/(ecosia|weibo)(?:__| \w+@)([\d\.]+)/i],[h,m],[/quark(?:pc)?\/([-\w\.]+)/i],[m,[h,"Quark"]],[/\bddg\/([\w\.]+)/i],[m,[h,"DuckDuckGo"]],[/(?:\buc? ?browser|(?:juc.+)ucweb| ucpc)[\/ ]?([\w\.]+)/i],[m,[h,"UCBrowser"]],[/microm.+\bqbcore\/([\w\.]+)/i,/\bqbcore\/([\w\.]+).+microm/i,/micromessenger\/([\w\.]+)/i],[m,[h,"WeChat"]],[/konqueror\/([\w\.]+)/i],[m,[h,"Konqueror"]],[/trident.+rv[: ]([\w\.]{1,9})\b.+like gecko/i],[m,[h,"IE"]],[/ya(?:search)?browser\/([\w\.]+)/i],[m,[h,"Yandex"]],[/slbrowser\/([\w\.]+)/i],[m,[h,"Smart "+Y+em]],[/(av(?:ast|g|ira))\/([\w\.]+)/i],[[h,/(.+)/,"$1 Secure"+em],m],[/norton\/([\w\.]+)/i],[m,[h,"Norton Private"+em]],[/\bfocus\/([\w\.]+)/i],[m,[h,ep+" Focus"]],[/ mms\/([\w\.]+)$/i],[m,[h,ed+" Neon"]],[/ opt\/([\w\.]+)$/i],[m,[h,ed+" Touch"]],[/coc_coc\w+\/([\w\.]+)/i],[m,[h,"Coc Coc"]],[/dolfin\/([\w\.]+)/i],[m,[h,"Dolphin"]],[/coast\/([\w\.]+)/i],[m,[h,ed+" Coast"]],[/miuibrowser\/([\w\.]+)/i],[m,[h,"MIUI"+em]],[/fxios\/([\w\.-]+)/i],[m,[h,ew+ep]],[/\bqihoobrowser\/?([\w\.]*)/i],[m,[h,"360"]],[/\b(qq)\/([\w\.]+)/i],[[h,/(.+)/,"$1Browser"],m],[/(oculus|sailfish|huawei|vivo|pico)browser\/([\w\.]+)/i],[[h,/(.+)/,"$1"+em],m],[/ HBPC\/([\w\.]+)/],[m,[h,z+em]],[/samsungbrowser\/([\w\.]+)/i],[m,[h,er+" Internet"]],[/metasr[\/ ]?([\d\.]+)/i],[m,[h,ef+" Explorer"]],[/(sogou)mo\w+\/([\d\.]+)/i],[[h,ef+" Mobile"],m],[/(electron)\/([\w\.]+) safari/i,/(tesla)(?: qtcarbrowser|\/(20\d\d\.[-\w\.]+))/i,/m?(qqbrowser|2345(?=browser|chrome|explorer))\w*[\/ ]?v?([\w\.]+)/i],[h,m],[/(lbbrowser|luakit|rekonq|steam(?= (clie|tenf|gameo)))/i],[h],[/ome\/([\w\.]+).+(iron(?= saf)|360(?=[es]e$))/i],[m,h],[/((?:fban\/fbios|fb_iab\/fb4a)(?!.+fbav)|;fbav\/([\w\.]+);)/i],[[h,eh],m,[f,E]],[/(kakao(?:talk|story))[\/ ]([\w\.]+)/i,/(naver)\(.*?(\d+\.[\w\.]+).*\)/i,/(daum)apps[\/ ]([\w\.]+)/i,/safari (line)\/([\w\.]+)/i,/\b(line)\/([\w\.]+)\/iab/i,/(alipay)client\/([\w\.]+)/i,/(twitter)(?:and| f.+e\/([\w\.]+))/i,/(bing)(?:web|sapphire)\/([\w\.]+)/i,/(instagram|snapchat|klarna)[\/ ]([-\w\.]+)/i],[h,m,[f,E]],[/\bgsa\/([\w\.]+) .*safari\//i],[m,[h,"GSA"],[f,E]],[/(?:musical_ly|trill)(?:.+app_?version\/|_)([\w\.]+)/i],[m,[h,"TikTok"],[f,E]],[/\[(linkedin)app\]/i],[h,[f,E]],[/(zalo(?:app)?)[\/\sa-z]*([\w\.-]+)/i],[[h,/(.+)/,"Zalo"],m,[f,E]],[/(chromium)[\/ ]([-\w\.]+)/i],[h,m],[/ome-(lighthouse)$/i],[h,[f,"fetcher"]],[/headlesschrome(?:\/([\w\.]+)| )/i],[m,[h,es+" Headless"]],[/wv\).+chrome\/([\w\.]+).+edgw\//i],[m,[h,eu+" WebView2"],[f,E]],[/; wv\).+(chrome)\/([\w\.]+)/i],[[h,es+" WebView"],m,[f,E]],[/droid.+ version\/([\w\.]+)\b.+(?:mobile safari|safari)/i],[m,[h,"Android"+em]],[/chrome\/([\w\.]+) mobile/i],[m,[h,ew+"Chrome"]],[/(chrome|omniweb|arora|[tizenoka]{5} ?browser)\/v?([\w\.]+)/i],[h,m],[/version\/([\w\.\,]+) .*mobile(?:\/\w+ | ?)safari/i],[m,[h,ew+"Safari"]],[/iphone .*mobile(?:\/\w+ | ?)safari/i],[[h,ew+"Safari"]],[/version\/([\w\.\,]+) .*(safari)/i],[m,h],[/webkit.+?(mobile ?safari|safari)(\/[\w\.]+)/i],[h,[m,"1"]],[/(webkit|khtml)\/([\w\.]+)/i],[h,m],[/(?:mobile|tablet);.*(firefox)\/([\w\.-]+)/i],[[h,ew+ep],m],[/(navigator|netscape\d?)\/([-\w\.]+)/i],[[h,"Netscape"],m],[/(wolvic|librewolf)\/([\w\.]+)/i],[h,m],[/mobile vr; rv:([\w\.]+)\).+firefox/i],[m,[h,ep+" Reality"]],[/ekiohf.+(flow)\/([\w\.]+)/i,/(swiftfox)/i,/(icedragon|iceweasel|camino|chimera|fennec|maemo browser|minimo|conkeror)[\/ ]?([\w\.\+]+)/i,/(seamonkey|k-meleon|icecat|iceape|firebird|phoenix|basilisk|waterfox)\/([-\w\.]+)$/i,/(firefox)\/([\w\.]+)/i,/(mozilla)\/([\w\.]+(?= .+rv\:.+gecko\/\d+)|[0-4][\w\.]+(?!.+compatible))/i,/(amaya|dillo|doris|icab|ladybird|lynx|mosaic|netsurf|obigo|polaris|w3m|(?:go|ice|up)[\. ]?browser)[-\/ ]?v?([\w\.]+)/i,/\b(links) \(([\w\.]+)/i],[h,[m,/_/g,"."]],[/(cobalt)\/([\w\.]+)/i],[h,[m,/[^\d\.]+./,""]]],cpu:[[/\b((amd|x|x86[-_]?|wow|win)64)\b/i],[[A,"amd64"]],[/(ia32(?=;))/i,/\b((i[346]|x)86)(pc)?\b/i],[[A,"ia32"]],[/\b(aarch64|arm(v?[89]e?l?|_?64))\b/i],[[A,"arm64"]],[/\b(arm(v[67])?ht?n?[fl]p?)\b/i],[[A,"armhf"]],[/( (ce|mobile); ppc;|\/[\w\.]+arm\b)/i],[[A,"arm"]],[/ sun4\w[;\)]/i],[[A,"sparc"]],[/\b(avr32|ia64(?=;)|68k(?=\))|\barm(?=v([1-7]|[5-7]1)l?|;|eabi)|(irix|mips|sparc)(64)?\b|pa-risc)/i,/((ppc|powerpc)(64)?)( mac|;|\))/i,/(?:osf1|[freopnt]{3,4}bsd) (alpha)/i],[[A,/ower/,"",eE]],[/mc680.0/i],[[A,"68k"]],[/winnt.+\[axp/i],[[A,"alpha"]]],device:[[/\b(sch-i[89]0\d|shw-m380s|sm-[ptx]\w{2,4}|gt-[pn]\d{2,4}|sgh-t8[56]9|nexus 10)/i],[b,[w,er],[f,C]],[/\b((?:s[cgp]h|gt|sm)-(?![lr])\w+|sc[g-]?[\d]+a?|galaxy nexus)/i,/samsung[- ]((?!sm-[lr]|browser)[-\w]+)/i,/sec-(sgh\w+)/i],[b,[w,er],[f,v]],[/(?:\/|\()(ip(?:hone|od)[\w, ]*)[\/\);]/i],[b,[w,J],[f,v]],[/\b(?:ios|apple\w+)\/.+[\(\/](ipad)/i,/\b(ipad)[\d,]*[;\] ].+(mac |i(pad)?)os/i],[b,[w,J],[f,C]],[/(macintosh);/i],[b,[w,J]],[/\b(sh-?[altvz]?\d\d[a-ekm]?)/i],[b,[w,eo],[f,v]],[/\b((?:brt|eln|hey2?|gdi|jdn)-a?[lnw]09|(?:ag[rm]3?|jdn2|kob2)-a?[lw]0[09]hn)(?: bui|\)|;)/i],[b,[w,X],[f,C]],[/honor([-\w ]+)[;\)]/i],[b,[w,X],[f,v]],[/\b((?:ag[rs][2356]?k?|bah[234]?|bg[2o]|bt[kv]|cmr|cpn|db[ry]2?|jdn2|got|kob2?k?|mon|pce|scm|sht?|[tw]gr|vrd)-[ad]?[lw][0125][09]b?|605hw|bg2-u03|(?:gem|fdr|m2|ple|t1)-[7a]0[1-4][lu]|t1-a2[13][lw]|mediapad[\w\. ]*(?= bui|\)))\b(?!.+d\/s)/i],[b,[w,z],[f,C]],[/(?:huawei) ?([-\w ]+)[;\)]/i,/\b(nexus 6p|\w{2,4}e?-[atu]?[ln][\dx][\dc][adnt]?)\b(?!.+d\/s)/i],[b,[w,z],[f,v]],[/oid[^\)]+; (2[\dbc]{4}(182|283|rp\w{2})[cgl]|m2105k81a?c)(?: bui|\))/i,/\b(?:xiao)?((?:red)?mi[-_ ]?pad[\w- ]*)(?: bui|\))/i],[[b,/_/g," "],[w,ei],[f,C]],[/\b; (\w+) build\/hm\1/i,/\b(hm[-_ ]?note?[_ ]?(?:\d\w)?) bui/i,/oid[^\)]+; (redmi[\-_ ]?(?:note|k)?[\w_ ]+|m?[12]\d[01]\d\w{3,6}|poco[\w ]+|(shark )?\w{3}-[ah]0|qin ?[1-3](s\+|ultra| pro)?)( bui|; wv|\))/i,/\b(mi[-_ ]?(?:a\d|one|one[_ ]plus|note|max|cc)?[_ ]?(?:\d{0,2}\w?)[_ ]?(?:plus|se|lite|pro)?( 5g|lte)?)(?: bui|\))/i,/; ([\w ]+) miui\/v?\d/i],[[b,/_/g," "],[w,ei],[f,v]],[/droid.+; (cph2[3-6]\d[13579]|((gm|hd)19|(ac|be|in|kb)20|(d[en]|eb|le|mt)21|ne22)[0-2]\d|p[g-l]\w[1m]10)\b/i,/(?:one)?(?:plus)? (a\d0\d\d)(?: b|\))/i],[b,[w,ee],[f,v]],[/; (\w+) bui.+ oppo/i,/\b(cph[12]\d{3}|p(?:af|c[al]|d\w|e[ar])[mt]\d0|x9007|a101op)\b/i],[b,[w,et],[f,v]],[/\b(opd2(\d{3}a?))(?: bui|\))/i],[b,[w,eR,{OnePlus:["203","304","403","404","413","415"],"*":et}],[f,C]],[/(vivo (5r?|6|8l?|go|one|s|x[il]?[2-4]?)[\w\+ ]*)(?: bui|\))/i],[b,[w,"BLU"],[f,v]],[/; vivo (\w+)(?: bui|\))/i,/\b(v[12]\d{3}\w?[at])(?: bui|;)/i],[b,[w,"Vivo"],[f,v]],[/\b(rmx[1-3]\d{3})(?: bui|;|\))/i],[b,[w,"Realme"],[f,v]],[/(ideatab[-\w ]+|602lv|d-42a|a101lv|a2109a|a3500-hv|s[56]000|pb-6505[my]|tb-?x?\d{3,4}(?:f[cu]|xu|[av])|yt\d?-[jx]?\d+[lfmx])( bui|;|\)|\/)/i,/lenovo ?(b[68]0[08]0-?[hf]?|tab(?:[\w- ]+?)|tb[\w-]{6,7})( bui|;|\)|\/)/i],[b,[w,Y],[f,C]],[/lenovo[-_ ]?([-\w ]+?)(?: bui|\)|\/)/i],[b,[w,Y],[f,v]],[/\b(milestone|droid(?:[2-4x]| (?:bionic|x2|pro|razr))?:?( 4g)?)\b[\w ]+build\//i,/\bmot(?:orola)?[- ]([\w\s]+)(\)| bui)/i,/((?:moto(?! 360)[-\w\(\) ]+|xt\d{3,4}[cgkosw\+]?[-\d]*|nexus 6)(?= bui|\)))/i],[b,[w,_],[f,v]],[/\b(mz60\d|xoom[2 ]{0,2}) build\//i],[b,[w,_],[f,C]],[/\b(?:lg)?([vl]k\-?\d{3}) bui| 3\.[-\w; ]{10}lg?-([06cv9]{3,4})/i],[b,[w,"LG"],[f,C]],[/(lm(?:-?f100[nv]?|-[\w\.]+)(?= bui|\))|nexus [45])/i,/\blg[-e;\/ ]+(?!.*(?:browser|netcast|android tv|watch|webos))(\w+)/i,/\blg-?([\d\w]+) bui/i],[b,[w,"LG"],[f,v]],[/(nokia) (t[12][01])/i],[w,b,[f,C]],[/(?:maemo|nokia).*(n900|lumia \d+|rm-\d+)/i,/nokia[-_ ]?(([-\w\. ]*?))( bui|\)|;|\/)/i],[[b,/_/g," "],[f,v],[w,"Nokia"]],[/(pixel (c|tablet))\b/i],[b,[w,V],[f,C]],[/droid.+;(?: google)? (g(01[13]a|020[aem]|025[jn]|1b60|1f8f|2ybb|4s1m|576d|5nz6|8hhn|8vou|a02099|c15s|d1yq|e2ae|ec77|gh2x|kv4x|p4bc|pj41|r83y|tt9q|ur25|wvk6)|pixel[\d ]*a?( pro)?( xl)?( fold)?( \(5g\))?)( bui|\))/i],[b,[w,V],[f,v]],[/(google) (pixelbook( go)?)/i],[w,b],[/droid.+; (a?\d[0-2]{2}so|[c-g]\d{4}|so[-gl]\w+|xq-\w\w\d\d)(?= bui|\).+chrome\/(?![1-6]{0,1}\d\.))/i],[b,[w,en],[f,v]],[/sony tablet [ps]/i,/\b(?:sony)?sgp\w+(?: bui|\))/i],[[b,"Xperia Tablet"],[w,en],[f,C]],[/(alexa)webm/i,/(kf[a-z]{2}wi|aeo(?!bc)\w\w)( bui|\))/i,/(kf[a-z]+)( bui|\)).+silk\//i],[b,[w,G],[f,C]],[/((?:sd|kf)[0349hijorstuw]+)( bui|\)).+silk\//i],[[b,/(.+)/g,"Fire Phone $1"],[w,G],[f,v]],[/(playbook);[-\w\),; ]+(rim)/i],[b,w,[f,C]],[/\b((?:bb[a-f]|st[hv])100-\d)/i,/(?:blackberry|\(bb10;) (\w+)/i],[b,[w,H],[f,v]],[/(?:\b|asus_)(transfo[prime ]{4,10} \w+|eeepc|slider \w+|nexus 7|padfone|p00[cj])/i],[b,[w,K],[f,C]],[/ (z[bes]6[027][012][km][ls]|zenfone \d\w?)\b/i],[b,[w,K],[f,v]],[/(nexus 9)/i],[b,[w,"HTC"],[f,C]],[/(htc)[-;_ ]{1,2}([\w ]+(?=\)| bui)|\w+)/i,/(zte)[- ]([\w ]+?)(?: bui|\/|\))/i,/(alcatel|geeksphone|nexian|panasonic(?!(?:;|\.))|sony(?!-bra))[-_ ]?([-\w]*)/i],[w,[b,/_/g," "],[f,v]],[/tcl (xess p17aa)/i,/droid [\w\.]+; ((?:8[14]9[16]|9(?:0(?:48|60|8[01])|1(?:3[27]|66)|2(?:6[69]|9[56])|466))[gqswx])(_\w(\w|\w\w))?(\)| bui)/i],[b,[w,"TCL"],[f,C]],[/droid [\w\.]+; (418(?:7d|8v)|5087z|5102l|61(?:02[dh]|25[adfh]|27[ai]|56[dh]|59k|65[ah])|a509dl|t(?:43(?:0w|1[adepqu])|50(?:6d|7[adju])|6(?:09dl|10k|12b|71[efho]|76[hjk])|7(?:66[ahju]|67[hw]|7[045][bh]|71[hk]|73o|76[ho]|79w|81[hks]?|82h|90[bhsy]|99b)|810[hs]))(_\w(\w|\w\w))?(\)| bui)/i],[b,[w,"TCL"],[f,v]],[/(itel) ((\w+))/i],[[w,eE],b,[f,eR,{tablet:["p10001l","w7001"],"*":"mobile"}]],[/droid.+; ([ab][1-7]-?[0178a]\d\d?)/i],[b,[w,"Acer"],[f,C]],[/droid.+; (m[1-5] note) bui/i,/\bmz-([-\w]{2,})/i],[b,[w,"Meizu"],[f,v]],[/; ((?:power )?armor(?:[\w ]{0,8}))(?: bui|\))/i],[b,[w,"Ulefone"],[f,v]],[/; (energy ?\w+)(?: bui|\))/i,/; energizer ([\w ]+)(?: bui|\))/i],[b,[w,"Energizer"],[f,v]],[/; cat (b35);/i,/; (b15q?|s22 flip|s48c|s62 pro)(?: bui|\))/i],[b,[w,"Cat"],[f,v]],[/((?:new )?andromax[\w- ]+)(?: bui|\))/i],[b,[w,"Smartfren"],[f,v]],[/droid.+; (a(in)?(0(15|59|6[35])|142)p?)/i],[b,[w,"Nothing"],[f,v]],[/; (x67 5g|tikeasy \w+|ac[1789]\d\w+)( b|\))/i,/archos ?(5|gamepad2?|([\w ]*[t1789]|hello) ?\d+[\w ]*)( b|\))/i],[b,[w,"Archos"],[f,C]],[/archos ([\w ]+)( b|\))/i,/; (ac[3-6]\d\w{2,8})( b|\))/i],[b,[w,"Archos"],[f,v]],[/blackview ([-\w ]+)( b|\))/i,/; (bv\d{4}[-\w ]*)( b|\))/i],[b,[w,"Blackview"],[f,v]],[/; (n159v)/i],[b,[w,"HMD"],[f,v]],[/((revvl[ \w\+]+|tm(?:rv|af)\w*[45]g(?:tb)?))( b|\))/i],[b,[f,function(e,t){return t.test.test(e)?t.ifTrue:t.ifFalse},{test:/ta?b/i,ifTrue:C,ifFalse:v}],[w,"T-Mobile"]],[/(imo) (tab \w+)/i,/(infinix|tecno) (x1101b?|p904|dp(7c|8d|10a)( pro)?|p70[1-3]a?|p904|t1101)/i],[w,b,[f,C]],[/(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus(?! zenw)|dell|jolla|meizu|motorola|polytron|tecno|micromax|advan)[-_ ]?([-\w]*)/i,/; (blu|coolpad|cubot|hmd|imo|infinix|lava|oneplus|tcl|wiko)[_ ]([-\w\+ ]+?)(?: bui|\)|; r)/i,/(hp) ([\w ]+\w)/i,/(microsoft); (lumia[\w ]+)/i,/(oppo) ?([\w ]+) bui/i,/(hisense) ([ehv][\w ]+)\)/i,/droid[^;]+; (philips)[_ ]([sv-x][\d]{3,4}[xz]?)/i],[w,b,[f,v]],[/(kobo)\s(ereader|touch)/i,/(hp).+(touchpad(?!.+tablet)|tablet)/i,/(kindle)\/([\w\.]+)/i],[w,b,[f,C]],[/(surface duo)/i],[b,[w,Z],[f,C]],[/droid [\d\.]+; (fp\du?)(?: b|\))/i],[b,[w,"Fairphone"],[f,v]],[/((?:tegranote|shield t(?!.+d tv))[\w- ]*?)(?: b|\))/i],[b,[w,$],[f,C]],[/(sprint) (\w+)/i],[w,b,[f,v]],[/(kin\.[onetw]{3})/i],[[b,/\./g," "],[w,Z],[f,v]],[/droid.+; ([c6]+|et5[16]|mc[239][23]x?|vc8[03]x?)\)/i],[b,[w,ea],[f,C]],[/droid.+; (ec30|ps20|tc[2-8]\d[kx])\)/i],[b,[w,ea],[f,v]],[/(philips)[\w ]+tv/i,/smart-tv.+(samsung)/i],[w,[f,x]],[/hbbtv.+maple;(\d+)/i],[[b,/^/,"SmartTV"],[w,er],[f,x]],[/(vizio)(?: |.+model\/)(\w+-\w+)/i,/tcast.+(lg)e?. ([-\w]+)/i],[w,b,[f,x]],[/(nux; netcast.+smarttv|lg (netcast\.tv-201\d|android tv))/i],[[w,"LG"],[f,x]],[/(apple) ?tv/i],[w,[b,J+" TV"],[f,x]],[/crkey.*devicetype\/chromecast/i],[[b,ec+" Third Generation"],[w,V],[f,x]],[/crkey.*devicetype\/([^/]*)/i],[[b,/^/,"Chromecast "],[w,V],[f,x]],[/fuchsia.*crkey/i],[[b,ec+" Nest Hub"],[w,V],[f,x]],[/crkey/i],[[b,ec],[w,V],[f,x]],[/(portaltv)/i],[b,[w,eh],[f,x]],[/droid.+aft(\w+)( bui|\))/i],[b,[w,G],[f,x]],[/(shield \w+ tv)/i],[b,[w,$],[f,x]],[/\(dtv[\);].+(aquos)/i,/(aquos-tv[\w ]+)\)/i],[b,[w,eo],[f,x]],[/(bravia[\w ]+)( bui|\))/i],[b,[w,en],[f,x]],[/(mi(tv|box)-?\w+) bui/i],[b,[w,ei],[f,x]],[/Hbbtv.*(technisat) (.*);/i],[w,b,[f,x]],[/\b(roku)[\dx]*[\)\/]((?:dvp-)?[\d\.]*)/i,/hbbtv\/\d+\.\d+\.\d+ +\([\w\+ ]*; *([\w\d][^;]*);([^;]*)/i],[[w,/.+\/(\w+)/,"$1",eR,{LG:"lge"}],[b,eS],[f,x]],[/(playstation \w+)/i],[b,[w,en],[f,y]],[/\b(xbox(?: one)?(?!; xbox))[\); ]/i],[b,[w,Z],[f,y]],[/(ouya)/i,/(nintendo) (\w+)/i,/(retroid) (pocket ([^\)]+))/i,/(valve).+(steam deck)/i,/droid.+; ((shield|rgcube|gr0006))( bui|\))/i],[[w,eR,{Nvidia:"Shield",Anbernic:"RGCUBE",Logitech:"GR0006"}],b,[f,y]],[/\b(sm-[lr]\d\d[0156][fnuw]?s?|gear live)\b/i],[b,[w,er],[f,k]],[/((pebble))app/i,/(asus|google|lg|oppo|xiaomi) ((pixel |zen)?watch[\w ]*)( bui|\))/i],[w,b,[f,k]],[/(ow(?:19|20)?we?[1-3]{1,3})/i],[b,[w,et],[f,k]],[/(watch)(?: ?os[,\/]|\d,\d\/)[\d\.]+/i],[b,[w,J],[f,k]],[/(opwwe\d{3})/i],[b,[w,ee],[f,k]],[/(moto 360)/i],[b,[w,_],[f,k]],[/(smartwatch 3)/i],[b,[w,en],[f,k]],[/(g watch r)/i],[b,[w,"LG"],[f,k]],[/droid.+; (wt63?0{2,3})\)/i],[b,[w,ea],[f,k]],[/droid.+; (glass) \d/i],[b,[w,V],[f,"xr"]],[/(pico) ([\w ]+) os\d/i],[w,b,[f,"xr"]],[/(quest( \d| pro)?s?).+vr/i],[b,[w,eh],[f,"xr"]],[/mobile vr; rv.+firefox/i],[[f,"xr"]],[/(tesla)(?: qtcarbrowser|\/[-\w\.]+)/i],[w,[f,B]],[/(aeobc)\b/i],[b,[w,G],[f,B]],[/(homepod).+mac os/i],[b,[w,J],[f,B]],[/windows iot/i],[[f,B]],[/droid.+; ([\w- ]+) (4k|android|smart|google)[- ]?tv/i],[b,[f,x]],[/\b((4k|android|smart|opera)[- ]?tv|tv; rv:|large screen[\w ]+safari)\b/i],[[f,x]],[/droid .+?; ([^;]+?)(?: bui|; wv\)|\) applew|; hmsc).+?(mobile|vr|\d) safari/i],[b,[f,eR,{mobile:"Mobile",xr:"VR","*":C}]],[/\b((tablet|tab)[;\/]|focus\/\d(?!.+mobile))/i],[[f,C]],[/(phone|mobile(?:[;\/]| [ \w\/\.]*safari)|pda(?=.+windows ce))/i],[[f,v]],[/droid .+?; ([\w\. -]+)( bui|\))/i],[b,[w,"Generic"]]],engine:[[/windows.+ edge\/([\w\.]+)/i],[m,[h,eu+"HTML"]],[/(arkweb)\/([\w\.]+)/i],[h,m],[/webkit\/537\.36.+chrome\/(?!27)([\w\.]+)/i],[m,[h,"Blink"]],[/(presto)\/([\w\.]+)/i,/(webkit|trident|netfront|netsurf|amaya|lynx|w3m|goanna|servo)\/([\w\.]+)/i,/ekioh(flow)\/([\w\.]+)/i,/(khtml|tasman|links|dillo)[\/ ]\(?([\w\.]+)/i,/(icab)[\/ ]([23]\.[\d\.]+)/i,/\b(libweb)/i],[h,m],[/ladybird\//i],[[h,"LibWeb"]],[/rv\:([\w\.]{1,9})\b.+(gecko)/i],[m,h]],os:[[/(windows nt) (6\.[23]); arm/i],[[h,/N/,"R"],[m,eR,eF]],[/(windows (?:phone|mobile|iot))(?: os)?[\/ ]?([\d\.]*( se)?)/i,/(windows)[\/ ](1[01]|2000|3\.1|7|8(\.1)?|9[58]|me|server 20\d\d( r2)?|vista|xp)/i],[h,m],[/windows nt ?([\d\.\)]*)(?!.+xbox)/i,/\bwin(?=3| ?9|n)(?:nt| 9x )?([\d\.;]*)/i],[[m,/(;|\))/g,"",eR,eF],[h,eA]],[/(windows ce)\/?([\d\.]*)/i],[h,m],[/[adehimnop]{4,7}\b(?:.*os ([\w]+) like mac|; opera)/i,/(?:ios;fbsv|ios(?=.+ip(?:ad|hone)|.+apple ?tv)|ip(?:ad|hone)(?: |.+i(?:pad)?)os|apple ?tv.+ios)[\/ ]([\w\.]+)/i,/\btvos ?([\w\.]+)/i,/cfnetwork\/.+darwin/i],[[m,/_/g,"."],[h,"iOS"]],[/(mac os x) ?([\w\. ]*)/i,/(macintosh|mac_powerpc\b)(?!.+(haiku|morphos))/i],[[h,"macOS"],[m,/_/g,"."]],[/android ([\d\.]+).*crkey/i],[m,[h,ec+" Android"]],[/fuchsia.*crkey\/([\d\.]+)/i],[m,[h,ec+" Fuchsia"]],[/crkey\/([\d\.]+).*devicetype\/smartspeaker/i],[m,[h,ec+" SmartSpeaker"]],[/linux.*crkey\/([\d\.]+)/i],[m,[h,ec+" Linux"]],[/crkey\/([\d\.]+)/i],[m,[h,ec]],[/droid ([\w\.]+)\b.+(android[- ]x86)/i],[m,h],[/(ubuntu) ([\w\.]+) like android/i],[[h,/(.+)/,"$1 Touch"],m],[/(harmonyos)[\/ ]?([\d\.]*)/i,/(android|bada|blackberry|kaios|maemo|meego|openharmony|qnx|rim tablet os|sailfish|series40|symbian|tizen)\w*[-\/\.; ]?([\d\.]*)/i],[h,m],[/\(bb(10);/i],[m,[h,H]],[/(?:symbian ?os|symbos|s60(?=;)|series ?60)[-\/ ]?([\w\.]*)/i],[m,[h,"Symbian"]],[/mozilla\/[\d\.]+ \((?:mobile[;\w ]*|tablet|tv|[^\)]*(?:viera|lg(?:l25|-d300)|alcatel ?o.+|y300-f1)); rv:([\w\.]+)\).+gecko\//i],[m,[h,ep+" OS"]],[/\b(?:hp)?wos(?:browser)?\/([\w\.]+)/i,/webos(?:[ \/]?|\.tv-20(?=2[2-9]))(\d[\d\.]*)/i],[m,[h,"webOS"]],[/web0s;.+?(?:chr[o0]me|safari)\/(\d+)/i],[[m,eR,{25:"120",24:"108",23:"94",22:"87",6:"79",5:"68",4:"53",3:"38",2:"538",1:"537","*":"TV"}],[h,"webOS"]],[/watch(?: ?os[,\/ ]|\d,\d\/)([\d\.]+)/i],[m,[h,"watchOS"]],[/cros [\w]+(?:\)| ([\w\.]+)\b)/i],[m,[h,"Chrome OS"]],[/kepler ([\w\.]+); (aft|aeo)/i],[m,[h,"Vega OS"]],[/(netrange)mmh/i,/(nettv)\/(\d+\.[\w\.]+)/i,/(nintendo|playstation) (\w+)/i,/(xbox); +xbox ([^\);]+)/i,/(pico) .+os([\w\.]+)/i,/\b(joli|palm)\b ?(?:os)?\/?([\w\.]*)/i,/linux.+(mint)[\/\(\) ]?([\w\.]*)/i,/(mageia|vectorlinux|fuchsia|arcaos|arch(?= ?linux))[;l ]([\d\.]*)/i,/([kxln]?ubuntu|debian|suse|opensuse|gentoo|slackware|fedora|mandriva|centos|pclinuxos|red ?hat|zenwalk|linpus|raspbian|plan 9|minix|risc os|contiki|deepin|manjaro|elementary os|sabayon|linspire|knoppix)(?: gnu[\/ ]linux)?(?: enterprise)?(?:[- ]linux)?(?:-gnu)?[-\/ ]?(?!chrom|package)([-\w\.]*)/i,/((?:open)?solaris)[-\/ ]?([\w\.]*)/i,/\b(aix)[; ]([1-9\.]{0,4})/i,/(hurd|linux|morphos)(?: (?:arm|x86|ppc)\w*| ?)([\w\.]*)/i,/(gnu) ?([\w\.]*)/i,/\b([-frentopcghs]{0,5}bsd|dragonfly)[\/ ]?(?!amd|[ix346]{1,2}86)([\w\.]*)/i,/(haiku) ?(r\d)?/i],[h,m],[/(sunos) ?([\d\.]*)/i],[[h,"Solaris"],m],[/\b(beos|os\/2|amigaos|openvms|hp-ux|serenityos)/i,/(unix) ?([\w\.]*)/i],[h,m]]},eP=(o={init:{},isIgnore:{},isIgnoreRgx:{},toString:{}},eM.call(o.init,[[c,[h,m,g,f]],["cpu",[A]],[u,[f,b,w]],[p,[h,m]],["os",[h,m]]]),eM.call(o.isIgnore,[[c,[m,g]],[p,[m]],["os",[m]]]),eM.call(o.isIgnoreRgx,[[c,/ ?browser$/i],["os",/ ?os$/i]]),eM.call(o.toString,[[c,[h,m]],["cpu",[A]],[u,[w,b]],[p,[h,m]],["os",[h,m]]]),o),eL=function(e,t){var r=eP.init[t],o=eP.isIgnore[t]||0,n=eP.isIgnoreRgx[t]||0,i=eP.toString[t]||0;function a(){eM.call(this,r)}return a.prototype.getItem=function(){return e},a.prototype.withClientHints=function(){return eb?eb.getHighEntropyValues(j).then(function(t){return e.setCH(new eU(t,!1)).parseCH().get()}):e.parseCH().get()},a.prototype.withFeatureCheck=function(){return e.detectFeature().get()},t!=d&&(a.prototype.is=function(e){var t=!1;for(var r in this)if(this.hasOwnProperty(r)&&!eC(o,r)&&eE(n?eW(n,this[r]):this[r])==eE(n?eW(n,e):e)){if(t=!0,e!=l)break}else if(e==l&&t){t=!t;break}return t},a.prototype.toString=function(){var e="";for(var t in i)typeof this[i[t]]!==l&&(e+=(e?" ":"")+this[i[t]]);return e||l}),a.prototype.then=function(e){var t=this,r=function(){for(var e in t)t.hasOwnProperty(e)&&(this[e]=t[e])};r.prototype={is:a.prototype.is,toString:a.prototype.toString,withClientHints:a.prototype.withClientHints,withFeatureCheck:a.prototype.withFeatureCheck};var o=new r;return e(o),o},new a};function eU(e,t){if(e=e||{},eM.call(this,j),t)eM.call(this,[[I,eB(e[R])],[M,eB(e[F])],[v,/\?1/.test(e[P])],[b,eQ(e[L])],[W,eQ(e[U])],[S,eQ(e[q])],[A,eQ(e[D])],[Q,eB(e[T])],[O,eQ(e[N])]]);else for(var r in e)this.hasOwnProperty(r)&&typeof e[r]!==l&&(this[r]=e[r])}function eq(e,t,r,o){return eM.call(this,[["itemType",e],["ua",t],["uaCH",o],["rgxMap",r],["data",eL(this,e)]]),this}function ej(e,t,r){if(typeof e===a?(ex(e,!0)?(typeof t===a&&(r=t),t=e):(r=e,t=void 0),e=void 0):typeof e!==s||ex(t,!0)||(r=t,t=void 0),r)if(typeof r.append===i){var o={};r.forEach(function(e,t){o[String(t).toLowerCase()]=e}),r=o}else{var l={};for(var h in r)r.hasOwnProperty(h)&&(l[String(h).toLowerCase()]=r[h]);r=l}if(!(this instanceof ej))return new ej(e,t,r).getResult();var f=typeof e===s?e:r&&r[n]?r[n]:eg&&eg.userAgent?eg.userAgent:"",w=new eU(r,!0),m=eT,A=function(e){return e==d?function(){return new eq(e,f,m,w).set("ua",f).set(c,this.getBrowser()).set("cpu",this.getCPU()).set(u,this.getDevice()).set(p,this.getEngine()).set("os",this.getOS()).get()}:function(){return new eq(e,f,m[e],w).parseUA().get()}};return eM.call(this,[["getBrowser",A(c)],["getCPU",A("cpu")],["getDevice",A(u)],["getEngine",A(p)],["getOS",A("os")],["getResult",A(d)],["getUA",function(){return f}],["setUA",function(e){return ek(e)&&(f=eS(e,500)),this}],["useExtension",function(e){return e&&(m=ey(m,e)),this}]]).setUA(f).useExtension(t),this}eq.prototype.get=function(e){return e?this.data.hasOwnProperty(e)?this.data[e]:void 0:this.data},eq.prototype.set=function(e,t){return this.data[e]=t,this},eq.prototype.setCH=function(e){return this.uaCH=e,this},eq.prototype.detectFeature=function(){if(eg&&eg.userAgent==this.ua)switch(this.itemType){case c:eg.brave&&typeof eg.brave.isBrave==i&&this.set(h,"Brave");break;case u:!this.get(f)&&eb&&eb[v]&&this.set(f,v),"Macintosh"==this.get(b)&&eg&&typeof eg.standalone!==l&&eg.maxTouchPoints&&eg.maxTouchPoints>2&&this.set(b,"iPad").set(f,C);break;case"os":!this.get(h)&&eb&&eb[W]&&this.set(h,eb[W]);break;case d:var e=this.data,t=function(t){return e[t].getItem().detectFeature().get()};this.set(c,t(c)).set("cpu",t("cpu")).set(u,t(u)).set(p,t(p)).set("os",t("os"))}return this},eq.prototype.parseUA=function(){switch(this.itemType!=d&&eO.call(this.data,this.ua,this.rgxMap),this.itemType){case c:this.set(g,eI(this.get(m)));break;case"os":if("iOS"==this.get(h)&&this.get(m)&&/^1[89][^\d]/.exec(this.get(m))){var e=/\) Version\/((\d+)[\d\.]*)/.exec(this.ua);e&&parseInt(e[2],10)>=26&&this.set(m,e[1])}}return this},eq.prototype.parseCH=function(){var e=this.uaCH,t=this.rgxMap;switch(this.itemType){case c:case p:var r,o=e[M]||e[I];if(o)for(var n=0;n<o.length;n++){var i=o[n].brand||o[n],a=o[n].version;this.itemType==c&&!/not.a.brand/i.test(i)&&(!r||/Chrom/.test(r)&&i!=el||r==eu&&/WebView2/.test(i))&&(i=eR(i,eN),(r=this.get(h))&&!/Chrom/.test(r)&&/Chrom/.test(i)||this.set(h,i).set(m,a).set(g,eI(a)),r=i),this.itemType==p&&i==el&&this.set(m,a)}break;case"cpu":var s=e[A];s&&(s&&"64"==e[O]&&(s+="64"),eO.call(this.data,s+";",t));break;case u:if(e[v]&&this.set(f,v),e[b]&&(this.set(b,e[b]),!this.get(f)||!this.get(w))){var l,y={};eO.call(y,"droid 9; "+e[b]+")",t),!this.get(f)&&y.type&&this.set(f,y.type),!this.get(w)&&y.vendor&&this.set(w,y.vendor)}if(e[Q]){if("string"!=typeof e[Q])for(var C=0;!l&&C<e[Q].length;)l=eR(e[Q][C++],eD);else l=eR(e[Q],eD);this.set(f,l)}break;case"os":var x=e[W];if(x){var k=e[S];x==eA&&(k=parseInt(eI(k),10)>=13?"11":"10"),this.set(h,x).set(m,k)}this.get(h)==eA&&"Xbox"==e[b]&&this.set(h,"Xbox").set(m,void 0);break;case d:var B=this.data,E=function(t){return B[t].getItem().setCH(e).parseCH().get()};this.set(c,E(c)).set("cpu",E("cpu")).set(u,E(u)).set(p,E(p)).set("os",E("os"))}return this},ej.VERSION="2.0.10",ej.BROWSER=ev([h,m,g,f]),ej.CPU=ev([A]),ej.DEVICE=ev([b,w,f,y,v,x,C,k,B]),ej.ENGINE=ej.OS=ev([h,m])},29722:(e,t,r)=>{r.d(t,{A:()=>o});let o=function(){for(var e,t,r=0,o="",n=arguments.length;r<n;r++)(e=arguments[r])&&(t=function e(t){var r,o,n="";if("string"==typeof t||"number"==typeof t)n+=t;else if("object"==typeof t)if(Array.isArray(t)){var i=t.length;for(r=0;r<i;r++)t[r]&&(o=e(t[r]))&&(n&&(n+=" "),n+=o)}else for(o in t)t[o]&&(n&&(n+=" "),n+=o);return n}(e))&&(o&&(o+=" "),o+=t);return o}},35502:(e,t,r)=>{r.d(t,{U:()=>a});var o=r(99414),n=r(12115),i=r(42482);function a(e={}){let{onConnect:t,onDisconnect:r}=e,s=(0,i.U)(e);(0,n.useEffect)(()=>(0,o.F)(s,{onChange(e,o){if(("reconnecting"===o.status||"connecting"===o.status&&void 0===o.address)&&"connected"===e.status){let{address:r,addresses:n,chain:i,chainId:a,connector:s}=e,l="reconnecting"===o.status||void 0===o.status;t?.({address:r,addresses:n,chain:i,chainId:a,connector:s,isReconnected:l})}else"connected"===o.status&&"disconnected"===e.status&&r?.()}}),[s,t,r])}},39606:(e,t,r)=>{r.d(t,{x:()=>o});function o(e){let t={formatters:void 0,fees:void 0,serializers:void 0,...e};return Object.assign(t,{extend:function e(t){return r=>{let o="function"==typeof r?r(t):r,n={...t,...o};return Object.assign(n,{extend:e(n)})}}(t)})}},41372:(e,t,r)=>{r.d(t,{$:()=>s});var o='-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',n={rounded:`SFRounded, ui-rounded, "SF Pro Rounded", ${o}`,system:o},i={large:{actionButton:"9999px",connectButton:"12px",modal:"24px",modalMobile:"28px"},medium:{actionButton:"10px",connectButton:"8px",modal:"16px",modalMobile:"18px"},none:{actionButton:"0px",connectButton:"0px",modal:"0px",modalMobile:"0px"},small:{actionButton:"4px",connectButton:"4px",modal:"8px",modalMobile:"8px"}},a={large:{modalOverlay:"blur(20px)"},none:{modalOverlay:"blur(0px)"},small:{modalOverlay:"blur(4px)"}},s=({borderRadius:e="large",fontStack:t="rounded",overlayBlur:r="none"})=>({blurs:{modalOverlay:a[r].modalOverlay},fonts:{body:n[t]},radii:{actionButton:i[e].actionButton,connectButton:i[e].connectButton,menuButton:i[e].connectButton,modal:i[e].modal,modalMobile:i[e].modalMobile}})},48934:(e,t,r)=>{r.d(t,{n:()=>u});var o=r(12115),n=r(53390),i=r(31967),a=r(98216),s=r(5858),l=class extends a.Q{#e;#t=void 0;#r;#o;constructor(e,t){super(),this.#e=e,this.setOptions(t),this.bindMethods(),this.#n()}bindMethods(){this.mutate=this.mutate.bind(this),this.reset=this.reset.bind(this)}setOptions(e){let t=this.options;this.options=this.#e.defaultMutationOptions(e),(0,s.f8)(this.options,t)||this.#e.getMutationCache().notify({type:"observerOptionsUpdated",mutation:this.#r,observer:this}),t?.mutationKey&&this.options.mutationKey&&(0,s.EN)(t.mutationKey)!==(0,s.EN)(this.options.mutationKey)?this.reset():this.#r?.state.status==="pending"&&this.#r.setOptions(this.options)}onUnsubscribe(){this.hasListeners()||this.#r?.removeObserver(this)}onMutationUpdate(e){this.#n(),this.#i(e)}getCurrentResult(){return this.#t}reset(){this.#r?.removeObserver(this),this.#r=void 0,this.#n(),this.#i()}mutate(e,t){return this.#o=t,this.#r?.removeObserver(this),this.#r=this.#e.getMutationCache().build(this.#e,this.options),this.#r.addObserver(this),this.#r.execute(e)}#n(){let e=this.#r?.state??(0,n.$)();this.#t={...e,isPending:"pending"===e.status,isSuccess:"success"===e.status,isError:"error"===e.status,isIdle:"idle"===e.status,mutate:this.mutate,reset:this.reset}}#i(e){i.jG.batch(()=>{if(this.#o&&this.hasListeners()){let t=this.#t.variables,r=this.#t.context,o={client:this.#e,meta:this.options.meta,mutationKey:this.options.mutationKey};if(e?.type==="success"){try{this.#o.onSuccess?.(e.data,t,r,o)}catch(e){Promise.reject(e)}try{this.#o.onSettled?.(e.data,null,t,r,o)}catch(e){Promise.reject(e)}}else if(e?.type==="error"){try{this.#o.onError?.(e.error,t,r,o)}catch(e){Promise.reject(e)}try{this.#o.onSettled?.(void 0,e.error,t,r,o)}catch(e){Promise.reject(e)}}}this.listeners.forEach(e=>{e(this.#t)})})}},c=r(35625);function u(e,t){let r=(0,c.jE)(t),[n]=o.useState(()=>new l(r,e));o.useEffect(()=>{n.setOptions(e)},[n,e]);let a=o.useSyncExternalStore(o.useCallback(e=>n.subscribe(i.jG.batchCalls(e)),[n]),()=>n.getCurrentResult(),()=>n.getCurrentResult()),u=o.useCallback((e,t)=>{n.mutate(e,t).catch(s.lQ)},[n]);if(a.error&&(0,s.GU)(n.options.throwOnError,[a.error]))throw a.error;return{...a,mutate:u,mutateAsync:a.mutate}}},52981:(e,t,r)=>{r.d(t,{$:()=>c});var o=r(84305),n=r(64200),i=r(72242),a=r(47002),s=r(5573),l=r(42482);function c(e={}){let{name:t,query:r={}}=e,u=(0,l.U)(e),p=(0,s.i)({config:u}),d=function(e,t={}){return{async queryFn({queryKey:t}){let{name:r,scopeKey:i,...a}=t[1];if(!r)throw Error("name is required");return function(e,t){let{chainId:r,...i}=t,a=e.getClient({chainId:r});return(0,n.T)(a,o.i,"getEnsAvatar")(i)}(e,{...a,name:r})},queryKey:function(e={}){return["ensAvatar",(0,i.xO)(e)]}(t)}}(u,{...e,chainId:e.chainId??p}),h=!!(t&&(r.enabled??!0));return(0,a.IT)({...r,...d,enabled:h})}},53390:(e,t,r)=>{r.d(t,{$:()=>s,s:()=>a});var o=r(31967),n=r(99190),i=r(9846),a=class extends n.k{#e;#a;#s;#l;constructor(e){super(),this.#e=e.client,this.mutationId=e.mutationId,this.#s=e.mutationCache,this.#a=[],this.state=e.state||s(),this.setOptions(e.options),this.scheduleGc()}setOptions(e){this.options=e,this.updateGcTime(this.options.gcTime)}get meta(){return this.options.meta}addObserver(e){this.#a.includes(e)||(this.#a.push(e),this.clearGcTimeout(),this.#s.notify({type:"observerAdded",mutation:this,observer:e}))}removeObserver(e){this.#a=this.#a.filter(t=>t!==e),this.scheduleGc(),this.#s.notify({type:"observerRemoved",mutation:this,observer:e})}optionalRemove(){this.#a.length||("pending"===this.state.status?this.scheduleGc():this.#s.remove(this))}continue(){return this.#l?.continue()??this.execute(this.state.variables)}async execute(e){let t=()=>{this.#c({type:"continue"})},r={client:this.#e,meta:this.options.meta,mutationKey:this.options.mutationKey};this.#l=(0,i.II)({fn:()=>this.options.mutationFn?this.options.mutationFn(e,r):Promise.reject(Error("No mutationFn found")),onFail:(e,t)=>{this.#c({type:"failed",failureCount:e,error:t})},onPause:()=>{this.#c({type:"pause"})},onContinue:t,retry:this.options.retry??0,retryDelay:this.options.retryDelay,networkMode:this.options.networkMode,canRun:()=>this.#s.canRun(this)});let o="pending"===this.state.status,n=!this.#l.canStart();try{if(o)t();else{this.#c({type:"pending",variables:e,isPaused:n}),this.#s.config.onMutate&&await this.#s.config.onMutate(e,this,r);let t=await this.options.onMutate?.(e,r);t!==this.state.context&&this.#c({type:"pending",context:t,variables:e,isPaused:n})}let i=await this.#l.start();return await this.#s.config.onSuccess?.(i,e,this.state.context,this,r),await this.options.onSuccess?.(i,e,this.state.context,r),await this.#s.config.onSettled?.(i,null,this.state.variables,this.state.context,this,r),await this.options.onSettled?.(i,null,e,this.state.context,r),this.#c({type:"success",data:i}),i}catch(t){try{await this.#s.config.onError?.(t,e,this.state.context,this,r)}catch(e){Promise.reject(e)}try{await this.options.onError?.(t,e,this.state.context,r)}catch(e){Promise.reject(e)}try{await this.#s.config.onSettled?.(void 0,t,this.state.variables,this.state.context,this,r)}catch(e){Promise.reject(e)}try{await this.options.onSettled?.(void 0,t,e,this.state.context,r)}catch(e){Promise.reject(e)}throw this.#c({type:"error",error:t}),t}finally{this.#s.runNext(this)}}#c(e){this.state=(t=>{switch(e.type){case"failed":return{...t,failureCount:e.failureCount,failureReason:e.error};case"pause":return{...t,isPaused:!0};case"continue":return{...t,isPaused:!1};case"pending":return{...t,context:e.context,data:void 0,failureCount:0,failureReason:null,error:null,isPaused:e.isPaused,status:"pending",variables:e.variables,submittedAt:Date.now()};case"success":return{...t,data:e.data,failureCount:0,failureReason:null,error:null,status:"success",isPaused:!1};case"error":return{...t,data:void 0,error:e.error,failureCount:t.failureCount+1,failureReason:e.error,isPaused:!1,status:"error"}}})(this.state),o.jG.batch(()=>{this.#a.forEach(t=>{t.onMutationUpdate(e)}),this.#s.notify({mutation:this,type:"updated",action:e})})}};function s(){return{context:void 0,data:void 0,error:null,failureCount:0,failureReason:null,isPaused:!1,status:"idle",variables:void 0,submittedAt:0}}},53745:(e,t,r)=>{r.d(t,{u:()=>u});var o=r(48934);async function n(e,t={}){let r;if(t.connector)r=t.connector;else{let{connections:t,current:o}=e.state,n=t.get(o);r=n?.connector}let o=e.state.connections;r&&(await r.disconnect(),r.emitter.off("change",e._internal.events.change),r.emitter.off("disconnect",e._internal.events.disconnect),r.emitter.on("connect",e._internal.events.connect),o.delete(r.uid)),e.setState(e=>{if(0===o.size)return{...e,connections:new Map,current:null,status:"disconnected"};let t=o.values().next().value;return{...e,connections:new Map(o),current:t.connector.uid}});{let t=e.state.current;if(!t)return;let r=e.state.connections.get(t)?.connector;if(!r)return;await e.storage?.setItem("recentConnectorId",r.id)}}var i=r(42482),a=r(1220);let s=[];function l(e){let t=[...e.state.connections.values()];return"reconnecting"===e.state.status||(0,a.b)(s,t)?s:(s=t,t)}var c=r(12115);function u(e={}){let{mutation:t}=e,r=(0,i.U)(e),s={mutationFn:e=>n(r,e),mutationKey:["disconnect"]},{mutate:p,mutateAsync:d,...h}=(0,o.n)({...t,...s});return{...h,connectors:(function(e={}){let t=(0,i.U)(e);return(0,c.useSyncExternalStore)(e=>(function(e,t){let{onChange:r}=t;return e.subscribe(()=>l(e),r,{equalityFn:a.b})})(t,{onChange:e}),()=>l(t),()=>l(t))})({config:r}).map(e=>e.connector),disconnect:p,disconnectAsync:d}}},57269:(e,t,r)=>{r.d(t,{Y:()=>c});var o=r(48934),n=r(75732),i=r(64200),a=r(97500);async function s(e,t){let r,{account:o,connector:s,...l}=t;return r="object"==typeof o&&"local"===o.type?e.getClient():await (0,a.r)(e,{account:o,connector:s}),(0,i.T)(r,n.l,"signMessage")({...l,...o?{account:o}:{}})}var l=r(42482);function c(e={}){var t;let{mutation:r}=e,n=(t=(0,l.U)(e),{mutationFn:e=>s(t,e),mutationKey:["signMessage"]}),{mutate:i,mutateAsync:a,...u}=(0,o.n)({...r,...n});return{...u,signMessage:i,signMessageAsync:a}}},58452:(e,t,r)=>{function o(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);t&&(o=o.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),r.push.apply(r,o)}return r}function n(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?o(Object(r),!0).forEach(function(t){!function(e,t,r){var o;(t="symbol"==typeof(o=function(e,t){if("object"!=typeof e||!e)return e;var r=e[Symbol.toPrimitive];if(void 0!==r){var o=r.call(e,t||"default");if("object"!=typeof o)return o;throw TypeError("@@toPrimitive must return a primitive value.")}return("string"===t?String:Number)(e)}(t,"string"))?o:String(o))in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r}(e,t,r[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):o(Object(r)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))})}return e}r.d(t,{U:()=>a});var i=e=>e,a=function(){return function(){for(var e=arguments.length,t=Array(e),r=0;r<e;r++)t[r]=arguments[r];var o=Object.assign({},...t.map(e=>e.styles)),a=Object.keys(o),s=a.filter(e=>"mappings"in o[e]);return Object.assign(e=>{var t=[],r={},a=n({},e),l=!1;for(var c of s){var u=e[c];if(null!=u)for(var p of(l=!0,o[c].mappings))r[p]=u,null==a[p]&&delete a[p]}var d=l?n(n({},r),a):e;for(var h in d)if(function(){var e=d[h],r=o[h];try{if(r.mappings)return 1;if("string"==typeof e||"number"==typeof e)t.push(r.values[e].defaultClass);else if(Array.isArray(e))for(var n=0;n<e.length;n++){var i=e[n];if(null!=i){var a=r.responsiveArray[n];t.push(r.values[i].conditions[a])}}else for(var s in e){var l=e[s];null!=l&&t.push(r.values[l].conditions[s])}}catch(e){throw e}}())continue;return i(t.join(" "))},{properties:new Set(a)})}(...arguments)}},58537:(e,t,r)=>{r.d(t,{o:()=>o});let o=(0,r(39606).x)({id:5042002,name:"Arc Testnet",nativeCurrency:{name:"USDC",symbol:"USDC",decimals:18},rpcUrls:{default:{http:["https://rpc.testnet.arc.network","https://rpc.quicknode.testnet.arc.network","https://rpc.blockdaemon.testnet.arc.network"],webSocket:["wss://rpc.testnet.arc.network","wss://rpc.quicknode.testnet.arc.network"]}},blockExplorers:{default:{name:"ArcScan",url:"https://testnet.arcscan.app",apiUrl:"https://testnet.arcscan.app/api"}},contracts:{multicall3:{address:"0xcA11bde05977b3631167028862bE2a173976CA11",blockCreated:0}},testnet:!0})},64200:(e,t,r)=>{r.d(t,{T:()=>o});function o(e,t,r){let o=e[t.name];if("function"==typeof o)return o;let n=e[r];return"function"==typeof n?n:r=>t(e,r)}},71062:(e,t,r)=>{r.d(t,{k:()=>S});var o=r(95155),n=r(12115);function i(e,t){return e.toString(2).padStart(t,"0")}function a(e,t){let r=e%t;return r>=0?r:t+r}function s(e,t){return Array(e).fill(t)}function l(e){return e-=e>>>1&0x55555555,((e=(0x33333333&e)+(e>>>2&0x33333333))+(e>>>4)&0xf0f0f0f)*0x1010101>>>24}function c(e){let t=0,r=0;for(let o of e)t=Math.max(t,o.length),r+=o.length;let o=new Uint8Array(r),n=0;for(let r=0;r<t;r++)for(let t of e)r<t.length&&(o[n++]=t[r]);return o}function u(e){return Object.freeze({has:t=>e.includes(t),decode:t=>{if(!Array.isArray(t)||t.length&&"string"!=typeof t[0])throw Error("alphabet.decode input should be array of strings");return t.map(t=>{if("string"!=typeof t)throw Error(`alphabet.decode: not string element=${t}`);let r=e.indexOf(t);if(-1===r)throw Error(`Unknown letter: "${t}". Allowed: ${e}`);return r})},encode:t=>{if(!Array.isArray(t)||t.length&&"number"!=typeof t[0])throw Error("alphabet.encode input should be an array of numbers");return t.map(t=>{if(!Number.isSafeInteger(t))throw Error(`integer expected: ${t}`);if(t<0||t>=e.length)throw Error(`Digit index outside alphabet: ${t} (alphabet: ${e.length})`);return e[t]})}})}function p(e){if(32!==e.length)throw Error("expects 32 element matrix");let t=[0x55555555,0x33333333,0xf0f0f0f,0xff00ff,65535];for(let r=0;r<5;r++){let o=t[r]>>>0,n=1<<r,i=n<<1;for(let t=0;t<32;t+=i)for(let r=0;r<n;r++){let i=t+r,a=i+n,s=e[i]>>>0,l=e[a]>>>0,c=(s>>>n^l)&o;e[i]=(s^c<<n)>>>0,e[a]=(l^c)>>>0}}}let d=e=>1<<(31&e)>>>0,h=(e,t)=>0===t?0:32===t?0xffffffff:(1<<t)-1<<e>>>0;class f{static size(e,t){if("number"==typeof e&&(e={height:e,width:e}),!Number.isSafeInteger(e.height)&&e.height!==1/0)throw Error(`Bitmap: invalid height=${e.height} (${typeof e.height})`);if(!Number.isSafeInteger(e.width)&&e.width!==1/0)throw Error(`Bitmap: invalid width=${e.width} (${typeof e.width})`);return void 0!==t&&(e={width:Math.min(e.width,t.width),height:Math.min(e.height,t.height)}),e}static fromString(e){let t,r=(e=e.replace(/^\n+/g,"").replace(/\n+$/g,"")).split("\n"),o=r.length,n=[];for(let e of r){let r=e.split("").map(e=>{if("X"===e)return!0;if(" "===e)return!1;if("?"!==e)throw Error(`Bitmap.fromString: unknown symbol=${e}`)});if(void 0!==t&&r.length!==t)throw Error(`Bitmap.fromString different row sizes: width=${t} cur=${r.length}`);t=r.length,n.push(r)}return void 0===t&&(t=0),new f({height:o,width:t},n)}defined;value;tailMask;words;fullWords;height;width;constructor(e,t){const{height:r,width:o}=f.size(e);if(!Number.isSafeInteger(r)||r<=0)throw Error(`Bitmap: invalid height=${r}, expected positive safe integer dimension`);if(!Number.isSafeInteger(o)||o<=0)throw Error(`Bitmap: invalid width=${o}, expected positive safe integer dimension`);if(this.height=r,this.width=o,this.tailMask=h(0,31&o||32),this.words=0|Math.ceil(o/32),this.fullWords=0|Math.floor(o/32),this.value=new Uint32Array(this.words*r),this.defined=new Uint32Array(this.value.length),t){if(t.length!==r)throw Error(`Bitmap: data height mismatch: exp=${r} got=${t.length}`);for(let e=0;e<r;e++){const r=t[e];if(!r||r.length!==o)throw Error(`Bitmap: data width mismatch at y=${e}: exp=${o} got=${r?.length}`);for(let t=0;t<o;t++)this.set(t,e,r[t])}}}point(e){return this.get(e.x,e.y)}isInside(e){return 0<=e.x&&e.x<this.width&&0<=e.y&&e.y<this.height}size(e){if(!e)return{height:this.height,width:this.width};let{x:t,y:r}=this.xy(e);return{height:this.height-r,width:this.width-t}}xy(e){if("number"==typeof e&&(e={x:e,y:e}),!Number.isSafeInteger(e.x))throw Error(`Bitmap: invalid x=${e.x}`);if(!Number.isSafeInteger(e.y))throw Error(`Bitmap: invalid y=${e.y}`);return e.x=a(e.x,this.width),e.y=a(e.y,this.height),e}wordIndex(e,t){return t*this.words+(e>>>5)}bitIndex(e,t){return{word:this.wordIndex(e,t),bit:31&e}}isDefined(e,t){let r=this.wordIndex(e,t),o=d(e);return(this.defined[r]&o)!=0}get(e,t){let r=this.wordIndex(e,t),o=d(e);return(this.value[r]&o)!=0}maskWord(e,t,r){let{defined:o,value:n}=this;o[e]|=t,n[e]=n[e]&~t|-r&t}set(e,t,r){void 0!==r&&this.maskWord(this.wordIndex(e,t),d(e),r)}fillRectConst(e,t,r,o,n){if(r<=0||o<=0||void 0===n)return;let{value:i,defined:a,words:s}=this,l=e>>>5,c=e+r-1>>>5,u=31&e,p=e+r-1&31;for(let e=0;e<o;e++){let r=(t+e)*s;if(l===c){let e=h(u,p-u+1);this.maskWord(r+l,e,n);continue}this.maskWord(r+l,h(u,32-u),n);for(let e=l+1;e<c;e++)a[r+e]=0xffffffff,i[r+e]=0xffffffff*!!n;this.maskWord(r+c,h(0,p+1),n)}}rectWords(e,t,r,o,n){for(let i=0;i<o;i++){let o=t+i;for(let t=0;t<r;){let a=e+t,{bit:s,word:l}=this.bitIndex(a,o),c=Math.min(32-s,r-t);n(l,a,t,i,c),t+=c}}}rect(e,t,r){let{x:o,y:n}=this.xy(e),{height:i,width:a}=f.size(t,this.size({x:o,y:n}));if("function"!=typeof r)return this.fillRectConst(o,n,a,i,r),this;let{defined:s,value:l}=this;return this.rectWords(o,n,a,i,(e,t,o,n,i)=>{let a=0,c=l[e];for(let e=0;e<i;e++){let i=d(t+e),s=r({x:o+e,y:n},(c&i)!=0);void 0!==s&&(a|=i,c=c&~i|-s&i)}s[e]|=a,l[e]=c}),this}rectRead(e,t,r){let{x:o,y:n}=this.xy(e),{height:i,width:a}=f.size(t,this.size({x:o,y:n})),{value:s}=this;return this.rectWords(o,n,a,i,(e,t,o,n,i)=>{let a=s[e];for(let e=0;e<i;e++){let i=d(t+e);r({x:o+e,y:n},(a&i)!=0)}}),this}hLine(e,t,r){return this.rect(e,{width:t,height:1},r)}vLine(e,t,r){return this.rect(e,{width:1,height:t},r)}border(e=2,t){if(!Number.isSafeInteger(e)||e<=0)throw Error(`Bitmap.border: invalid size=${e}`);let r=new f({height:this.height+2*e,width:this.width+2*e});return r.rect(0,1/0,t),r.embed({x:e,y:e},this),r}embed(e,t){let{x:r,y:o}=this.xy(e),{height:n,width:i}=f.size(t.size(),this.size({x:r,y:o}));if(i<=0||n<=0)return this;let{value:a,defined:s}=this,{words:l,value:c}=t;for(let e=0;e<n;e++){let n=e*l;for(let u=0;u<i;){let p=r+u,{word:d,bit:f}=this.bitIndex(p,o+e),{word:w,bit:m}=t.bitIndex(u,e),A=Math.min(32-f,i-u),g=c[w],b=m&&w+1<n+l?c[w+1]:0,y=m?(g>>>m|b<<32-m)>>>0:g,v=h(f,A),C=(y&h(0,A))<<f>>>0;s[d]|=v,a[d]=a[d]&~v|C,u+=A}}return this}rectSlice(e,t=this.size()){let{x:r,y:o}=this.xy(e),{height:n,width:i}=f.size(t,this.size({x:r,y:o})),a=new f({height:n,width:i});return this.rectRead({x:r,y:o},{height:n,width:i},(e,t)=>{this.isDefined(r+e.x,o+e.y)&&a.set(e.x,e.y,t)}),a}transpose(){let{height:e,width:t,value:r,defined:o,words:n}=this,i=new f({height:t,width:e}),{words:a,value:s,defined:l,tailMask:c}=i,u=new Uint32Array(32),d=new Uint32Array(32);for(let h=0;h<e;h+=32)for(let f=0;f<n;f++){let n=Math.min(32,e-h);for(let e=0;e<n;e++){let t=this.wordIndex(32*f,h+e);u[e]=r[t],d[e]=o[t]}u.fill(0,n),d.fill(0,n),p(u),p(d);for(let e=0;e<32;e++){let r=32*f+e;if(r>=t)break;let o=i.wordIndex(h,r),n=h>>>5==a-1?c:0xffffffff;s[o]=u[e]&n,l[o]=d[e]&n}}return i}negate(){let e=this.defined.length;for(let t=0;t<e;t++)this.value[t]=~this.value[t],this.defined[t]=0xffffffff;return this}scale(e){if(!Number.isSafeInteger(e)||e>1024)throw Error(`invalid scale factor: ${e}`);let{height:t,width:r}=this;return new f({height:e*t,width:e*r}).rect({x:0,y:0},1/0,({x:t,y:r})=>this.get(t/e|0,r/e|0))}clone(){let e=new f(this.size());return e.defined.set(this.defined),e.value.set(this.value),e}assertDrawn(){let{height:e,width:t,defined:r,tailMask:o,fullWords:n,words:i}=this;if(e&&t)for(let t=0;t<e;t++){let e=t*i;for(let t=0;t<n;t++)if(0xffffffff!==r[e+t])throw Error("Invalid color type=undefined");if(i!==n&&(r[e+n]&o)!==o)throw Error("Invalid color type=undefined")}}countPatternInRow(e,t,...r){if(!Number.isSafeInteger(t)||t<=0||t>=32)throw Error("wrong patternLen");let o=(1<<t)-1,{height:n,width:i,value:a,words:s}=this;if(!Number.isSafeInteger(e)||e<0||e>=n)return 0;let l=0,c=this.wordIndex(0,e);for(let e=0,n=0;e<s;e++){let u=a[c+e],p=e===s-1&&31&i||32;for(let i=0;i<p;i++)if(n=(n<<1|u>>>i&1)&o,!(32*e+i+1<t)){for(let e of r)if(n===e){l++;break}}}return l}getRuns(e,t){let r,{height:o,width:n,value:i,words:a}=this;if(0===n||!Number.isSafeInteger(e)||e<0||e>=o)return;let s=0,l=this.wordIndex(0,e);for(let e=0;e<a;e++){let o=i[l+e],c=e===a-1&&31&n||32;for(let e=0;e<c;e++){let n=(o&1<<e)!=0;if(n===r){s++;continue}void 0!==r&&t(s,r),r=n,s=1}}void 0!==r&&t(s,r)}popcnt(){let{height:e,width:t,words:r,fullWords:o,tailMask:n}=this;if(!e||!t)return 0;let i=0;for(let t=0;t<e;t++){let e=t*r;for(let t=0;t<o;t++)i+=l(this.value[e+t]);r!==o&&(i+=l(this.value[e+o]&n))}return i}countBoxes2x2(e){let{height:t,width:r,words:o}=this;if(r<2||!Number.isSafeInteger(e)||e<0||e+1>=t)return 0;let n=this.wordIndex(0,e),i=this.wordIndex(0,e+1),a=0==(31&r)?0x7fffffff:h(0,r-1&31),s=0;for(let e=0;e<o;e++){let t=this.value[n+e],r=this.value[i+e],c=(~(t^r)>>>0&~(t^(t>>>1|(1&(e+1<o?this.value[n+e+1]>>>0:0))<<31)>>>0)>>>0&~(r^(r>>>1|(1&(e+1<o?this.value[i+e+1]>>>0:0))<<31)>>>0)>>>0)>>>0;e===o-1&&(c&=a),s+=l(c)}return s}toString(){let e="";for(let t=0;t<this.height;t++){let r="";for(let e=0;e<this.width;e++){let o=this.get(e,t);r+=this.isDefined(e,t)?o?"X":" ":"?"}e+=r+(t+1===this.height?"":"\n")}return e}toRaw(){let e=Array.from({length:this.height},()=>Array(this.width));for(let t=0;t<this.height;t++){let r=e[t];for(let e=0;e<this.width;e++)r[e]=this.get(e,t)}return e}toASCII(){let{height:e,width:t}=this,r="";for(let o=0;o<e;o+=2){for(let n=0;n<t;n++){let t=this.get(n,o),i=o+1>=e||this.get(n,o+1);t||i?!t&&i?r+="▀":t&&!i?r+="▄":t&&i&&(r+=" "):r+="█"}r+="\n"}return r}toTerm(){let e="\x1b[0m",t="\x1b[1;47m  "+e,r="\x1b[40m  "+e,o="";for(let e=0;e<this.height;e++){for(let n=0;n<this.width;n++)o+=this.get(n,e)?r:t;o+="\n"}return o}toSVG(e=!0){let t,r=`<svg viewBox="0 0 ${this.width} ${this.height}" xmlns="http://www.w3.org/2000/svg">`,o="";return this.rectRead(0,1/0,(n,i)=>{if(!i)return;let{x:a,y:s}=n;if(!e){r+=`<rect x="${a}" y="${s}" width="1" height="1" />`;return}let l=`M${a} ${s}`;if(t){let e=`m${a-t.x} ${s-t.y}`;e.length<=l.length&&(l=e)}let c=a<10?`H${a}`:"h-1";o+=`${l}h1v1${c}Z`,t=n}),e&&(r+=`<path d="${o}"/>`),r+="</svg>"}toGIF(){let e=e=>[255&e,e>>>8&255],t=[...e(this.width),...e(this.height)],r=[];this.rectRead(0,1/0,(e,t)=>r.push(+(!0===t)));let o=[71,73,70,56,55,97,...t,246,0,0,255,255,255,...s(381,0),44,0,0,0,0,...t,0,7],n=Math.floor(r.length/126);for(let e=0;e<n;e++)o.push(127,128,...r.slice(126*e,126*(e+1)).map(e=>+e));return o.push(r.length%126+1,128,...r.slice(126*n).map(e=>+e)),o.push(1,129,0,59),new Uint8Array(o)}toImage(e=!1){let{height:t,width:r}=this.size(),o=new Uint8Array(t*r*(e?3:4)),n=0;for(let i=0;i<t;i++)for(let t=0;t<r;t++){let r=255*!this.get(t,i);o[n++]=r,o[n++]=r,o[n++]=r,e||(o[n++]=255)}return{height:t,width:r,data:o}}}let w=Object.freeze(["low","medium","quartile","high"]),m=Object.freeze(["numeric","alphanumeric","byte","kanji","eci"]),A=[26,44,70,100,134,172,196,242,292,346,404,466,532,581,655,733,815,901,991,1085,1156,1258,1364,1474,1588,1706,1828,1921,2051,2185,2323,2465,2611,2761,2876,3034,3196,3362,3532,3706],g={low:[7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],medium:[10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28],quartile:[13,22,18,26,18,24,18,22,20,24,28,26,24,20,30,24,28,28,26,30,28,30,30,30,30,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],high:[17,28,22,16,22,28,26,26,24,28,24,28,22,24,24,30,28,28,26,28,30,24,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30]},b={low:[1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],medium:[1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49],quartile:[1,1,2,2,4,4,6,6,8,8,8,10,12,16,12,17,16,18,21,20,23,23,25,27,29,34,34,35,38,40,43,45,48,51,53,56,59,62,65,68],high:[1,1,2,4,4,4,5,6,8,8,11,11,16,16,18,16,19,21,25,25,25,34,30,32,35,37,40,42,45,48,51,54,57,60,63,66,70,74,77,81]},y=Object.freeze({size:Object.freeze({encode:e=>21+4*(e-1),decode:e=>(e-17)/4}),sizeType:e=>Math.floor((e+7)/17),alignmentPatterns(e){if(1===e)return[];let t=y.size.encode(e)-6-1,r=t-6,o=Math.ceil(r/28),n=Math.floor(r/o);n%2?n+=1:r%o*2>=o&&(n+=2);let i=[6];for(let e=1;e<o;e++)i.push(t-(o-e)*n);return i.push(t),i},ECCode:Object.freeze({low:1,medium:0,quartile:3,high:2}),formatMask:21522,formatBits(e,t){let r=y.ECCode[e]<<3|t,o=r;for(let e=0;e<10;e++)o=o<<1^(o>>9)*1335;return(r<<10|o)^y.formatMask},versionBits(e){let t=e;for(let e=0;e<12;e++)t=t<<1^(t>>11)*7973;return e<<12|t},alphabet:Object.freeze({numeric:u("0123456789"),alphanumerc:u("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:")}),lengthBits:(e,t)=>({numeric:[10,12,14],alphanumeric:[9,11,13],byte:[8,16,16],kanji:[8,10,12],eci:[0,0,0]})[t][y.sizeType(e)],modeBits:Object.freeze({numeric:"0001",alphanumeric:"0010",byte:"0100",kanji:"1000",eci:"0111"}),capacity(e,t){let r=A[e-1],o=g[t][e-1],n=b[t][e-1],i=Math.floor(r/n)-o,a=n-r%n;return{words:o,numBlocks:n,shortBlocks:a,blockLen:i,capacity:(r-o*n)*8,total:(o+i)*n+n-a}}}),v=Object.freeze([(e,t)=>(e+t)%2==0,(e,t)=>t%2==0,(e,t)=>e%3==0,(e,t)=>(e+t)%3==0,(e,t)=>(Math.floor(t/2)+Math.floor(e/3))%2==0,(e,t)=>e*t%2+e*t%3==0,(e,t)=>(e*t%2+e*t%3)%2==0,(e,t)=>((e+t)%2+e*t%3)%2==0]),C={tables:(e=>{let t=s(256,0),r=s(256,0);for(let o=0,n=1;o<256;o++)t[o]=n,r[n]=o,256&(n<<=1)&&(n^=e);return{exp:t,log:r}})(285),exp:e=>C.tables.exp[e],log(e){if(0===e)throw Error(`GF.log: invalid arg=${e}`);return C.tables.log[e]%255},mul:(e,t)=>0===e||0===t?0:C.tables.exp[(C.tables.log[e]+C.tables.log[t])%255],add:(e,t)=>e^t,pow:(e,t)=>C.tables.exp[C.tables.log[e]*t%255],inv(e){if(0===e)throw Error(`GF.inverse: invalid arg=${e}`);return C.tables.exp[255-C.tables.log[e]]},polynomial(e){if(0==e.length)throw Error("GF.polymomial: invalid length");if(0!==e[0])return e;let t=0;for(;t<e.length-1&&0==e[t];t++);return e.slice(t)},monomial(e,t){if(e<0)throw Error(`GF.monomial: invalid degree=${e}`);if(0==t)return[0];let r=s(e+1,0);return r[0]=t,C.polynomial(r)},degree:e=>e.length-1,coefficient:(e,t)=>e[C.degree(e)-t],mulPoly(e,t){if(0===e[0]||0===t[0])return[0];let r=s(e.length+t.length-1,0);for(let o=0;o<e.length;o++)for(let n=0;n<t.length;n++)r[o+n]=C.add(r[o+n],C.mul(e[o],t[n]));return C.polynomial(r)},mulPolyScalar(e,t){if(0==t)return[0];if(1==t)return e;let r=s(e.length,0);for(let o=0;o<e.length;o++)r[o]=C.mul(e[o],t);return C.polynomial(r)},mulPolyMonomial(e,t,r){if(t<0)throw Error("GF.mulPolyMonomial: invalid degree");if(0==r)return[0];let o=s(e.length+t,0);for(let t=0;t<e.length;t++)o[t]=C.mul(e[t],r);return C.polynomial(o)},addPoly(e,t){if(0===e[0])return t;if(0===t[0])return e;let r=e,o=t;r.length>o.length&&([r,o]=[o,r]);let n=s(o.length,0),i=o.length-r.length,a=o.slice(0,i);for(let e=0;e<a.length;e++)n[e]=a[e];for(let e=i;e<o.length;e++)n[e]=C.add(r[e-i],o[e]);return C.polynomial(n)},remainderPoly(e,t){let r=Array.from(e);for(let o=0;o<e.length-t.length+1;o++){let e=r[o];if(0!==e)for(let n=1;n<t.length;n++)0!==t[n]&&(r[o+n]=C.add(r[o+n],C.mul(t[n],e)))}return r.slice(e.length-t.length+1,r.length)},divisorPoly(e){let t=[1];for(let r=0;r<e;r++)t=C.mulPoly(t,[1,C.pow(2,r)]);return t},evalPoly(e,t){if(0==t)return C.coefficient(e,0);let r=e[0];for(let o=1;o<e.length;o++)r=C.add(C.mul(t,r),e[o]);return r},euclidian(e,t,r){C.degree(e)<C.degree(t)&&([e,t]=[t,e]);let o=e,n=t,i=[0],a=[1];for(;2*C.degree(n)>=r;){let e=o,t=i;if(o=n,i=a,0===o[0])throw Error("rLast[0] === 0");n=e;let r=[0],s=C.inv(o[0]);for(;C.degree(n)>=C.degree(o)&&0!==n[0];){let e=C.degree(n)-C.degree(o),t=C.mul(n[0],s);r=C.addPoly(r,C.monomial(e,t)),n=C.addPoly(n,C.mulPolyMonomial(o,e,t))}if(r=C.mulPoly(r,i),a=C.addPoly(r,t),C.degree(n)>=C.degree(o))throw Error(`Division failed r: ${n}, rLast: ${o}`)}let s=C.coefficient(a,0);if(0==s)throw Error("sigmaTilde(0) was zero");let l=C.inv(s);return[C.mulPolyScalar(a,l),C.mulPolyScalar(n,l)]}};function x(e){if("string"!=typeof e)throw Error(`utf8ToBytes expected string, got ${typeof e}`);return new Uint8Array(new TextEncoder().encode(e))}function k(e,t,r,o,n=x){let a="",l=r.length;if("numeric"===o){let e=y.alphabet.numeric.decode(r.split("")),t=e.length;for(let r=0;r<t-2;r+=3)a+=i(100*e[r]+10*e[r+1]+e[r+2],10);t%3==1?a+=i(e[t-1],4):t%3==2&&(a+=i(10*e[t-2]+e[t-1],7))}else if("alphanumeric"===o){let e=y.alphabet.alphanumerc.decode(r.split("")),t=e.length;for(let r=0;r<t-1;r+=2)a+=i(45*e[r]+e[r+1],11);t%2==1&&(a+=i(e[t-1],6))}else if("byte"===o){let e=n(r);l=e.length,a=Array.from(e).map(e=>i(e,8)).join("")}else throw Error("encode: unsupported type");let{capacity:u}=y.capacity(e,t),p=i(l,y.lengthBits(e,o)),d=y.modeBits[o]+p+a;if(d.length>u)throw Error("Capacity overflow");(d+="0".repeat(Math.min(4,Math.max(0,u-d.length)))).length%8&&(d+="0".repeat(8-d.length%8));let h="1110110000010001";for(let e=0;d.length!==u;e++)d+=h[e%h.length];let f=Uint8Array.from(d.match(/(.{8})/g).map(e=>Number(`0b${e}`)));return(function(e,t){let{words:r,shortBlocks:o,numBlocks:n,blockLen:i,total:a}=y.capacity(e,t),l={encode(e){let t=C.divisorPoly(r),o=Array.from(e);return o.push(...t.slice(0,-1).fill(0)),Uint8Array.from(C.remainderPoly(o,t))},decode(e){let t=e.slice(),o=C.polynomial(Array.from(e)),n=s(r,0),i=!1;for(let e=0;e<r;e++){let t=C.evalPoly(o,C.exp(e));n[n.length-1-e]=t,0!==t&&(i=!0)}if(!i)return t;n=C.polynomial(n);let a=C.monomial(r,1),[l,c]=C.euclidian(a,n,r),u=s(C.degree(l),0),p=0;for(let e=1;e<256&&p<u.length;e++)0===C.evalPoly(l,e)&&(u[p++]=C.inv(e));if(p!==u.length)throw Error("RS.decode: invalid errors number");for(let e=0;e<u.length;e++){let r=t.length-1-C.log(u[e]);if(r<0)throw Error("RS.decode: invalid error location");let o=C.inv(u[e]),n=1;for(let t=0;t<u.length;t++)e!==t&&(n=C.mul(n,C.add(1,C.mul(u[t],o))));t[r]=C.add(t[r],C.mul(C.evalPoly(c,o),C.inv(n)))}return t}};return{encode(e){let t=[],r=[];for(let a=0;a<n;a++){let n=i+ +!(a<o);t.push(e.subarray(0,n)),r.push(l.encode(e.subarray(0,n))),e=e.subarray(n)}let a=c(t),s=c(r),u=new Uint8Array(a.length+s.length);return u.set(a),u.set(s,a.length),u},decode(e){if(e.length!==a)throw Error(`interleave.decode: len(data)=${e.length}, total=${a}`);let t=[];for(let e=0;e<n;e++){let n=e<o;t.push(new Uint8Array(r+i+ +!n))}let s=0;for(let r=0;r<i;r++)for(let o=0;o<n;o++)t[o][r]=e[s++];for(let r=o;r<n;r++)t[r][i]=e[s++];for(let a=i;a<i+r;a++)for(let r=0;r<n;r++){let n=r<o;t[r][a+ +!n]=e[s++]}let c=[];for(let e of t)c.push(...Array.from(l.decode(e)).slice(0,-r));return Uint8Array.from(c)}}})(e,t).encode(f)}function B(e,t,r,o,n=!1){let i=function(e,t,r,o=!1){let n=y.size.encode(e),i=new f(n+2),a=new f(3).rect(0,3,!0).border(1,!1).border(1,!0).border(1,!1);i=(i=i.embed(0,a).embed({x:-a.width,y:0},a).embed({x:0,y:-a.height},a)).rectSlice(1,n);let s=new f(1).rect(0,1,!0).border(1,!1).border(1,!0),l=y.alignmentPatterns(e);for(let e of l)for(let t of l)i.isDefined(t,e)||i.embed({x:t-2,y:e-2},s);i=i.hLine({x:0,y:6},1/0,({x:e})=>i.isDefined(e,6)?void 0:e%2==0).vLine({x:6,y:0},1/0,({y:e})=>i.isDefined(6,e)?void 0:e%2==0);{let e=y.formatBits(t,r),a=t=>!o&&(e>>t&1)==1;for(let e=0;e<6;e++)i.set(8,e,a(e));for(let e=6;e<8;e++)i.set(8,e+1,a(e));for(let e=8;e<15;e++)i.set(8,n-15+e,a(e));for(let e=0;e<8;e++)i.set(n-e-1,8,a(e));for(let e=8;e<9;e++)i.set(15-e-1+1,8,a(e));for(let e=9;e<15;e++)i.set(15-e-1,8,a(e));i.set(8,n-8,!o)}if(e>=7){let t=y.versionBits(e);for(let e=0;e<18;e+=1){let r=!o&&(t>>e&1)==1,a=Math.floor(e/3),s=e%3+n-8-3;i.set(s,a,r),i.set(a,s,r)}}return i}(e,t,o,n),a=0,s=8*r.length;if(!function(e,t,r){let o=e.height,n=v[t],i=-1,a=o-1;for(let t=o-1;t>0;t-=2){for(6==t&&(t=5);;a+=i){for(let o=0;o<2;o+=1){let i=t-o;e.isDefined(i,a)||r(i,a,n(i,a))}if(a+i<0||a+i>=o)break}i=-i}}(i,o,(e,t,o)=>{let n=!1;a<s&&(n=(r[a>>>3]>>(7-a&7)&1)!=0,a++),i.set(e,t,n!==o)}),a!==s)throw Error("QR: bytes left after draw");return i}let E=e=>{let t=e.map(e=>e?"1":"0").join("");return{len:t.length,n:Number(`0b${t}`)}},I=[!0,!1,!0,!0,!0,!1,!0],Q=[!1,!1,!1,!1],M=E([...I,...Q]),W=E([...Q,...I]);function S(e){let{arena:t,...r}=e;return(0,o.jsxs)(S.Root,{...r,children:[(0,o.jsx)(S.Finder,{}),(0,o.jsx)(S.Cells,{}),t&&(0,o.jsx)(S.Arena,{children:"string"==typeof t?(0,o.jsx)("img",{alt:"Arena",src:t,style:{borderRadius:1,height:"100%",objectFit:"cover",width:"100%"}}):t})]})}!function(e){function t(t){let{children:r,size:i="100%",value:a,version:s,errorCorrection:l,...c}=t,u=n.useMemo(()=>(n.Children.map(r,e=>n.isValidElement(e)&&"string"!=typeof e.type&&"displayName"in e.type&&"Arena"===e.type.displayName||null)??[]).some(Boolean),[r]),p=n.useMemo(()=>{let e=l;return u&&"low"===l&&(e="medium"),function(e,t={}){let{errorCorrection:r,version:o}=t,n=function(e,t="raw",r={}){let o=void 0!==r.ecc?r.ecc:"medium";if(!w.includes(o))throw Error(`Invalid error correction mode=${o}. Expected: ${w}`);let n=void 0!==r.encoding?r.encoding:function(e){let t="numeric";for(let r of e)if(!y.alphabet.numeric.has(r)&&(t="alphanumeric",!y.alphabet.alphanumerc.has(r)))return"byte";return t}(e);if(!m.includes(n))throw Error(`Encoding: invalid mode=${n}. Expected: ${m}`);if("kanji"===n||"eci"===n)throw Error(`Encoding: ${n} is not supported (yet?).`);void 0!==r.mask&&function(e){if(![0,1,2,3,4,5,6,7].includes(e)||!v[e])throw Error(`Invalid mask=${e}. Expected number [0..7]`)}(r.mask);let i=r.version,a,s=Error("Unknown error");if(void 0!==i){var l=i;if(!Number.isSafeInteger(l)||l<1||l>40)throw Error(`Invalid version=${l}. Expected number [1..40]`);a=k(i,o,e,n,r.textEncoder)}else for(let t=1;t<=40;t++)try{a=k(t,o,e,n,r.textEncoder),i=t;break}catch(e){s=e}if(!i||!a)throw s;let c=function(e,t,r,o){if(void 0===o){let n,i,a=(i=1/0,{add(e,t){e>=i||(n=t,i=e)},get:()=>n,score:()=>i});for(let o=0;o<v.length;o++)a.add(function(e){let{width:t,height:r}=e,o=e.transpose(),n=0;for(let t=0;t<r;t++)e.getRuns(t,e=>{e>=5&&(n+=3+(e-5))});for(let e=0;e<t;e++)o.getRuns(e,e=>{e>=5&&(n+=3+(e-5))});let i=0;for(let t=0;t<r-1;t++)i+=3*e.countBoxes2x2(t);let a=0;for(let t=0;t<r;t++)a+=40*e.countPatternInRow(t,M.len,M.n,W.n);for(let e=0;e<t;e++)a+=40*o.countPatternInRow(e,M.len,M.n,W.n);let s=r*t,l=Math.ceil(Math.max(0,Math.abs(100*e.popcnt()-50*s)-5*s)/(5*s));return n+i+a+10*l}(B(e,t,r,o,!0)),o);o=a.get()}if(void 0===o)throw Error("Cannot find mask");return B(e,t,r,o)}(i,o,a,r.mask);c.assertDrawn();let u=void 0===r.border?2:r.border;if(!Number.isSafeInteger(u)||u<=0)throw Error(`invalid border=${u}`);if(c=c.border(u,!1),void 0!==r.scale&&(c=c.scale(r.scale)),"raw"===t)return c.toRaw();if("ascii"===t)return c.toASCII();if("svg"===t)return c.toSVG(r.optimize);if("gif"===t)return c.toGIF();if("term"===t)return c.toTerm();else throw Error(`Unknown output: ${t}`)}(e,"raw",{border:0,ecc:r,scale:1,version:o});return{edgeLength:n.length,finderLength:7,grid:n,value:e}}(a,{errorCorrection:e,version:s})},[a,u,l,s]),d=+p.edgeLength,h=p.finderLength/2,f=u?Math.floor(d/4):0,A=n.useMemo(()=>({arenaSize:f,cellSize:1,edgeSize:d,qrcode:p,finderSize:h}),[f,d,p,h]);return(0,o.jsx)(e.Context.Provider,{value:A,children:(0,o.jsxs)("svg",{...c,width:i,height:i,viewBox:`0 0 ${d} ${d}`,xmlns:"http://www.w3.org/2000/svg",children:[(0,o.jsx)("title",{children:"QR Code"}),r]})})}function r(t){let{className:r,fill:i,innerClassName:a,radius:s=.25}=t,{cellSize:l,edgeSize:c,finderSize:u}=n.useContext(e.Context);function p({position:e}){let t=u-(u-l)-l/2;"top-right"===e&&(t=c-u-(u-l)-l/2);let n=u-(u-l)-l/2;"bottom-left"===e&&(n=c-u-(u-l)-l/2);let d=u-1.5*l;"top-right"===e&&(d=c-u-1.5*l);let h=u-1.5*l;return"bottom-left"===e&&(h=c-u-1.5*l),(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)("rect",{className:r,stroke:i??"currentColor",fill:"transparent",x:t,y:n,width:l+(u-l)*2,height:l+(u-l)*2,rx:2*s*(u-l),ry:2*s*(u-l),strokeWidth:l}),(0,o.jsx)("rect",{className:a,fill:i??"currentColor",x:d,y:h,width:3*l,height:3*l,rx:2*s*l,ry:2*s*l})]})}return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(p,{position:"top-left"}),(0,o.jsx)(p,{position:"top-right"}),(0,o.jsx)(p,{position:"bottom-left"})]})}function i(t){let{className:r,fill:i="currentColor",inset:a=!0,radius:s=1}=t,{arenaSize:l,cellSize:c,qrcode:u}=n.useContext(e.Context),{edgeLength:p,finderLength:d}=u,h=n.useMemo(()=>{let e="";for(let t=0;t<u.grid.length;t++){let r=u.grid[t];if(r)for(let o=0;o<r.length;o++){if(!r[o])continue;let n=p/2-l/2,i=n+l;if(t>=n&&t<=i&&o>=n&&o<=i)continue;let u=t<d&&o<d,h=t<d&&o>=p-d,f=t>=p-d&&o<d;if(u||h||f)continue;let w=a?.1*c:0,m=(c-2*w)/2,A=o*c+c/2,g=t*c+c/2,b=A-m,y=A+m,v=g-m,C=g+m,x=s*m;e+=`M ${b+x},${v} L ${y-x},${v} A ${x},${x} 0 0,1 ${y},${v+x} L ${y},${C-x} A ${x},${x} 0 0,1 ${y-x},${C} L ${b+x},${C} A ${x},${x} 0 0,1 ${b},${C-x} L ${b},${v+x} A ${x},${x} 0 0,1 ${b+x},${v} z`}}return e},[l,c,p,d,u.grid,a,s]);return(0,o.jsx)("path",{className:r,d:h,fill:i})}function a(t){let{children:r}=t,{arenaSize:i,cellSize:a,edgeSize:s}=n.useContext(e.Context),l=Math.ceil(s/2-i/2),c=i+i%2;return(0,o.jsx)("foreignObject",{x:l,y:l,width:c,height:c,children:(0,o.jsx)("div",{style:{alignItems:"center",display:"flex",fontSize:1,justifyContent:"center",height:"100%",overflow:"hidden",width:"100%",padding:a/2,boxSizing:"border-box"},children:r})})}e.Context=n.createContext(null),e.Root=t,(t=e.Root||(e.Root={})).displayName="Root",e.Finder=r,(r=e.Finder||(e.Finder={})).displayName="Finder",e.Cells=i,(i=e.Cells||(e.Cells={})).displayName="Cells",e.Arena=a,(a=e.Arena||(e.Arena={})).displayName="Arena"}(S||(S={}))},74941:(e,t,r)=>{function o(e,t){return Object.defineProperty(e,"__recipe__",{value:t,writable:!1}),e}function n(e){var{conditions:t}=e;if(!t)throw Error("Styles have no conditions");return o(function(e){if("string"==typeof e||"number"==typeof e||"boolean"==typeof e){if(!t.defaultCondition)throw Error("No default condition");return{[t.defaultCondition]:e}}if(Array.isArray(e)){if(!("responsiveArray"in t))throw Error("Responsive arrays are not supported");var r={};for(var o in t.responsiveArray)null!=e[o]&&(r[t.responsiveArray[o]]=e[o]);return r}return e},{importPath:"@vanilla-extract/sprinkles/createUtils",importName:"createNormalizeValueFn",args:[{conditions:e.conditions}]})}function i(e){var{conditions:t}=e;if(!t)throw Error("Styles have no conditions");var r=n(e);return o(function(e,o){if("string"==typeof e||"number"==typeof e||"boolean"==typeof e){if(!t.defaultCondition)throw Error("No default condition");return o(e,t.defaultCondition)}var n=Array.isArray(e)?r(e):e,i={};for(var a in n)null!=n[a]&&(i[a]=o(n[a],a));return i},{importPath:"@vanilla-extract/sprinkles/createUtils",importName:"createMapValueFn",args:[{conditions:e.conditions}]})}r.d(t,{q:()=>i,f:()=>n})},79064:(e,t,r)=>{r.d(t,{n:()=>o});var o=`{
  "connect_wallet": {
    "label": "Connect Wallet",
    "wrong_network": {
      "label": "Wrong network"
    }
  },

  "intro": {
    "title": "What is a Wallet?",
    "description": "A wallet is used to send, receive, store, and display digital assets. It's also a new way to log in, without needing to create new accounts and passwords on every website.",
    "digital_asset": {
      "title": "A Home for your Digital Assets",
      "description": "Wallets are used to send, receive, store, and display digital assets like Ethereum and NFTs."
    },
    "login": {
      "title": "A New Way to Log In",
      "description": "Instead of creating new accounts and passwords on every website, just connect your wallet."
    },
    "get": {
      "label": "Get a Wallet"
    },
    "learn_more": {
      "label": "Learn More"
    }
  },

  "sign_in": {
    "label": "Verify your account",
    "description": "To finish connecting, you must sign a message in your wallet to verify that you are the owner of this account.",
    "message": {
      "send": "Sign message",
      "preparing": "Preparing message...",
      "cancel": "Cancel",
      "preparing_error": "Error preparing message, please retry!"
    },
    "signature": {
      "waiting": "Waiting for signature...",
      "verifying": "Verifying signature...",
      "signing_error": "Error signing message, please retry!",
      "verifying_error": "Error verifying signature, please retry!",
      "oops_error": "Oops, something went wrong!"
    }
  },

  "connect": {
    "label": "Connect",
    "title": "Connect a Wallet",
    "new_to_ethereum": {
      "description": "New to Ethereum wallets?",
      "learn_more": {
        "label": "Learn More"
      }
    },
    "learn_more": {
      "label": "Learn more"
    },
    "recent": "Recent",
    "status": {
      "opening": "Opening %{wallet}...",
      "connecting": "Connecting",
      "connect_mobile": "Continue in %{wallet}",
      "not_installed": "%{wallet} is not installed",
      "not_available": "%{wallet} is not available",
      "confirm": "Confirm connection in the extension",
      "confirm_mobile": "Accept connection request in the wallet"
    },
    "secondary_action": {
      "get": {
        "description": "Don't have %{wallet}?",
        "label": "GET"
      },
      "install": {
        "label": "INSTALL"
      },
      "retry": {
        "label": "RETRY"
      }
    },
    "walletconnect": {
      "description": {
        "full": "Need the official WalletConnect modal?",
        "compact": "Need the WalletConnect modal?"
      },
      "open": {
        "label": "OPEN"
      }
    }
  },

  "connect_scan": {
    "title": "Scan with %{wallet}",
    "fallback_title": "Scan with your phone"
  },

  "connector_group": {
    "installed": "Installed",
    "recommended": "Recommended",
    "other": "Other",
    "popular": "Popular",
    "more": "More",
    "others": "Others"
  },

  "get": {
    "title": "Get a Wallet",
    "action": {
      "label": "GET"
    },
    "mobile": {
      "description": "Mobile Wallet"
    },
    "extension": {
      "description": "Browser Extension"
    },
    "mobile_and_extension": {
      "description": "Mobile Wallet and Extension"
    },
    "mobile_and_desktop": {
      "description": "Mobile and Desktop Wallet"
    },
    "looking_for": {
      "title": "Not what you're looking for?",
      "mobile": {
        "description": "Select a wallet on the main screen to get started with a different wallet provider."
      },
      "desktop": {
        "compact_description": "Select a wallet on the main screen to get started with a different wallet provider.",
        "wide_description": "Select a wallet on the left to get started with a different wallet provider."
      }
    }
  },

  "get_options": {
    "title": "Get started with %{wallet}",
    "short_title": "Get %{wallet}",
    "mobile": {
      "title": "%{wallet} for Mobile",
      "description": "Use the mobile wallet to explore the world of Ethereum.",
      "download": {
        "label": "Get the app"
      }
    },
    "extension": {
      "title": "%{wallet} for %{browser}",
      "description": "Access your wallet right from your favorite web browser.",
      "download": {
        "label": "Add to %{browser}"
      }
    },
    "desktop": {
      "title": "%{wallet} for %{platform}",
      "description": "Access your wallet natively from your powerful desktop.",
      "download": {
        "label": "Add to %{platform}"
      }
    }
  },

  "get_mobile": {
    "title": "Install %{wallet}",
    "description": "Scan with your phone to download on iOS or Android",
    "continue": {
      "label": "Continue"
    }
  },

  "get_instructions": {
    "mobile": {
      "connect": {
        "label": "Connect"
      },
      "learn_more": {
        "label": "Learn More"
      }
    },
    "extension": {
      "refresh": {
        "label": "Refresh"
      },
      "learn_more": {
        "label": "Learn More"
      }
    },
    "desktop": {
      "connect": {
        "label": "Connect"
      },
      "learn_more": {
        "label": "Learn More"
      }
    }
  },

  "chains": {
    "title": "Switch Networks",
    "wrong_network": "Wrong network detected, switch or disconnect to continue.",
    "confirm": "Confirm in Wallet",
    "switching_not_supported": "Your wallet does not support switching networks from %{appName}. Try switching networks from within your wallet instead.",
    "switching_not_supported_fallback": "Your wallet does not support switching networks from this app. Try switching networks from within your wallet instead.",
    "disconnect": "Disconnect",
    "connected": "Connected"
  },

  "profile": {
    "disconnect": {
      "label": "Disconnect"
    },
    "copy_address": {
      "label": "Copy Address",
      "copied": "Copied!"
    },
    "explorer": {
      "label": "View more on explorer"
    },
    "transactions": {
      "description": "%{appName} transactions will appear here...",
      "description_fallback": "Your transactions will appear here...",
      "recent": {
        "title": "Recent Transactions"
      },
      "clear": {
        "label": "Clear All"
      }
    }
  },

  "wallet_connectors": {
    "ready": {
      "qr_code": {
        "step1": {
          "description": "Add Ready to your home screen for faster access to your wallet.",
          "title": "Open the Ready app"
        },
        "step2": {
          "description": "Create a wallet and username, or import an existing wallet.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the Scan QR button"
        }
      }
    },

    "berasig": {
      "extension": {
        "step1": {
          "title": "Install the BeraSig extension",
          "description": "We recommend pinning BeraSig to your taskbar for easier access to your wallet."
        },
        "step2": {
          "title": "Create a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "best": {
      "qr_code": {
        "step1": {
          "title": "Open the Best Wallet app",
          "description": "Add Best Wallet to your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap the QR icon and scan",
          "description": "Tap the QR icon on your homescreen, scan the code and confirm the prompt to connect."
        }
      }
    },

    "bifrost": {
      "qr_code": {
        "step1": {
          "description": "We recommend putting Bifrost Wallet on your home screen for quicker access.",
          "title": "Open the Bifrost Wallet app"
        },
        "step2": {
          "description": "Create or import a wallet using your recovery phrase.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the scan button"
        }
      }
    },

    "bitget": {
      "qr_code": {
        "step1": {
          "description": "We recommend putting Bitget Wallet on your home screen for quicker access.",
          "title": "Open the Bitget Wallet app"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the scan button"
        }
      },

      "extension": {
        "step1": {
          "description": "We recommend pinning Bitget Wallet to your taskbar for quicker access to your wallet.",
          "title": "Install the Bitget Wallet extension"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension.",
          "title": "Refresh your browser"
        }
      }
    },

    "bitski": {
      "extension": {
        "step1": {
          "description": "We recommend pinning Bitski to your taskbar for quicker access to your wallet.",
          "title": "Install the Bitski extension"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension.",
          "title": "Refresh your browser"
        }
      }
    },

    "bitverse": {
      "qr_code": {
        "step1": {
          "title": "Open the Bitverse Wallet app",
          "description": "Add Bitverse Wallet to your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap the QR icon and scan",
          "description": "Tap the QR icon on your homescreen, scan the code and confirm the prompt to connect."
        }
      }
    },

    "bloom": {
      "desktop": {
        "step1": {
          "title": "Open the Bloom Wallet app",
          "description": "We recommend putting Bloom Wallet on your home screen for quicker access."
        },
        "step2": {
          "description": "Create or import a wallet using your recovery phrase.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you have a wallet, click on Connect to connect via Bloom. A connection prompt in the app will appear for you to confirm the connection.",
          "title": "Click on Connect"
        }
      }
    },

    "bybit": {
      "qr_code": {
        "step1": {
          "description": "We recommend putting Bybit on your home screen for faster access to your wallet.",
          "title": "Open the Bybit app"
        },
        "step2": {
          "description": "You can easily backup your wallet using our backup feature on your phone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the scan button"
        }
      },

      "extension": {
        "step1": {
          "description": "Click at the top right of your browser and pin Bybit Wallet for easy access.",
          "title": "Install the Bybit Wallet extension"
        },
        "step2": {
          "description": "Create a new wallet or import an existing one.",
          "title": "Create or Import a wallet"
        },
        "step3": {
          "description": "Once you set up Bybit Wallet, click below to refresh the browser and load up the extension.",
          "title": "Refresh your browser"
        }
      }
    },

    "binance": {
      "qr_code": {
        "step1": {
          "description": "We recommend putting Binance on your home screen for faster access to your wallet.",
          "title": "Open the Binance app"
        },
        "step2": {
          "description": "You can easily backup your wallet using our backup feature on your phone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the WalletConnect button"
        }
      },
      "extension": {
        "step1": {
          "title": "Install the Binance Wallet extension",
          "description": "We recommend pinning Binance Wallet to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "coin98": {
      "qr_code": {
        "step1": {
          "description": "We recommend putting Coin98 Wallet on your home screen for faster access to your wallet.",
          "title": "Open the Coin98 Wallet app"
        },
        "step2": {
          "description": "You can easily backup your wallet using our backup feature on your phone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the WalletConnect button"
        }
      },

      "extension": {
        "step1": {
          "description": "Click at the top right of your browser and pin Coin98 Wallet for easy access.",
          "title": "Install the Coin98 Wallet extension"
        },
        "step2": {
          "description": "Create a new wallet or import an existing one.",
          "title": "Create or Import a wallet"
        },
        "step3": {
          "description": "Once you set up Coin98 Wallet, click below to refresh the browser and load up the extension.",
          "title": "Refresh your browser"
        }
      }
    },

    "coinbase": {
      "qr_code": {
        "step1": {
          "description": "We recommend putting Coinbase Wallet on your home screen for quicker access.",
          "title": "Open the Coinbase Wallet app"
        },
        "step2": {
          "description": "You can easily backup your wallet using the cloud backup feature.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the scan button"
        }
      },

      "extension": {
        "step1": {
          "description": "We recommend pinning Coinbase Wallet to your taskbar for quicker access to your wallet.",
          "title": "Install the Coinbase Wallet extension"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension.",
          "title": "Refresh your browser"
        }
      }
    },

    "compass": {
      "extension": {
        "step1": {
          "description": "We recommend pinning Compass Wallet to your taskbar for quicker access to your wallet.",
          "title": "Install the Compass Wallet extension"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension.",
          "title": "Refresh your browser"
        }
      }
    },

    "core": {
      "qr_code": {
        "step1": {
          "description": "We recommend putting Core on your home screen for faster access to your wallet.",
          "title": "Open the Core app"
        },
        "step2": {
          "description": "You can easily backup your wallet using our backup feature on your phone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the WalletConnect button"
        }
      },

      "extension": {
        "step1": {
          "description": "We recommend pinning Core to your taskbar for quicker access to your wallet.",
          "title": "Install the Core extension"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension.",
          "title": "Refresh your browser"
        }
      }
    },

    "fox": {
      "qr_code": {
        "step1": {
          "description": "We recommend putting FoxWallet on your home screen for quicker access.",
          "title": "Open the FoxWallet app"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the scan button"
        }
      }
    },

    "frontier": {
      "qr_code": {
        "step1": {
          "description": "We recommend putting Frontier Wallet on your home screen for quicker access.",
          "title": "Open the Frontier Wallet app"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the scan button"
        }
      },

      "extension": {
        "step1": {
          "description": "We recommend pinning Frontier Wallet to your taskbar for quicker access to your wallet.",
          "title": "Install the Frontier Wallet extension"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension.",
          "title": "Refresh your browser"
        }
      }
    },

    "im_token": {
      "qr_code": {
        "step1": {
          "title": "Open the imToken app",
          "description": "Put imToken app on your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap Scanner Icon in top right corner",
          "description": "Choose New Connection, then scan the QR code and confirm the prompt to connect."
        }
      }
    },

    "iopay": {
      "qr_code": {
        "step1": {
          "description": "We recommend putting ioPay on your home screen for faster access to your wallet.",
          "title": "Open the ioPay app"
        },
        "step2": {
          "description": "You can easily backup your wallet using our backup feature on your phone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the WalletConnect button"
        }
      }
    },

    "kaikas": {
      "extension": {
        "step1": {
          "description": "We recommend pinning Kaikas to your taskbar for quicker access to your wallet.",
          "title": "Install the Kaikas extension"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension.",
          "title": "Refresh your browser"
        }
      },
      "qr_code": {
        "step1": {
          "title": "Open the Kaikas app",
          "description": "Put Kaikas app on your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap Scanner Icon in top right corner",
          "description": "Choose New Connection, then scan the QR code and confirm the prompt to connect."
        }
      }
    },

    "kaia": {
      "extension": {
        "step1": {
          "description": "We recommend pinning Kaia to your taskbar for quicker access to your wallet.",
          "title": "Install the Kaia extension"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension.",
          "title": "Refresh your browser"
        }
      },
      "qr_code": {
        "step1": {
          "title": "Open the Kaia app",
          "description": "Put Kaia app on your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap Scanner Icon in top right corner",
          "description": "Choose New Connection, then scan the QR code and confirm the prompt to connect."
        }
      }
    },

    "kraken": {
      "qr_code": {
        "step1": {
          "title": "Open the Kraken Wallet app",
          "description": "Add Kraken Wallet to your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap the QR icon and scan",
          "description": "Tap the QR icon on your homescreen, scan the code and confirm the prompt to connect."
        }
      }
    },

    "kresus": {
      "qr_code": {
        "step1": {
          "title": "Open the Kresus Wallet app",
          "description": "Add Kresus Wallet to your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap the QR icon and scan",
          "description": "Tap the QR icon on your homescreen, scan the code and confirm the prompt to connect."
        }
      }
    },

    "magicEden": {
      "extension": {
        "step1": {
          "title": "Install the Magic Eden extension",
          "description": "We recommend pinning Magic Eden to your taskbar for easier access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret recovery phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "metamask": {
      "qr_code": {
        "step1": {
          "title": "Open the MetaMask app",
          "description": "We recommend putting MetaMask on your home screen for quicker access."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Tap the scan button",
          "description": "After you scan, a connection prompt will appear for you to connect your wallet."
        }
      },

      "extension": {
        "step1": {
          "title": "Install the MetaMask extension",
          "description": "We recommend pinning MetaMask to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "nestwallet": {
      "extension": {
        "step1": {
          "title": "Install the NestWallet extension",
          "description": "We recommend pinning NestWallet to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "okx": {
      "qr_code": {
        "step1": {
          "title": "Open the OKX Wallet app",
          "description": "We recommend putting OKX Wallet on your home screen for quicker access."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Tap the scan button",
          "description": "After you scan, a connection prompt will appear for you to connect your wallet."
        }
      },

      "extension": {
        "step1": {
          "title": "Install the OKX Wallet extension",
          "description": "We recommend pinning OKX Wallet to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "omni": {
      "qr_code": {
        "step1": {
          "title": "Open the Omni app",
          "description": "Add Omni to your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap the QR icon and scan",
          "description": "Tap the QR icon on your home screen, scan the code and confirm the prompt to connect."
        }
      }
    },

    "1inch": {
      "qr_code": {
        "step1": {
          "description": "Put 1inch Wallet on your home screen for faster access to your wallet.",
          "title": "Open the 1inch Wallet app"
        },
        "step2": {
          "description": "Create a wallet and username, or import an existing wallet.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the Scan QR button"
        }
      }
    },

    "token_pocket": {
      "qr_code": {
        "step1": {
          "title": "Open the TokenPocket app",
          "description": "We recommend putting TokenPocket on your home screen for quicker access."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Tap the scan button",
          "description": "After you scan, a connection prompt will appear for you to connect your wallet."
        }
      },

      "extension": {
        "step1": {
          "title": "Install the TokenPocket extension",
          "description": "We recommend pinning TokenPocket to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "trust": {
      "qr_code": {
        "step1": {
          "title": "Open the Trust Wallet app",
          "description": "Put Trust Wallet on your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap WalletConnect in Settings",
          "description": "Choose New Connection, then scan the QR code and confirm the prompt to connect."
        }
      },

      "extension": {
        "step1": {
          "title": "Install the Trust Wallet extension",
          "description": "Click at the top right of your browser and pin Trust Wallet for easy access."
        },
        "step2": {
          "title": "Create or Import a wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up Trust Wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "uniswap": {
      "qr_code": {
        "step1": {
          "title": "Open the Uniswap app",
          "description": "Add Uniswap Wallet to your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap the QR icon and scan",
          "description": "Tap the QR icon on your homescreen, scan the code and confirm the prompt to connect."
        }
      }
    },

    "zerion": {
      "qr_code": {
        "step1": {
          "title": "Open the Zerion app",
          "description": "We recommend putting Zerion on your home screen for quicker access."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Tap the scan button",
          "description": "After you scan, a connection prompt will appear for you to connect your wallet."
        }
      },

      "extension": {
        "step1": {
          "title": "Install the Zerion extension",
          "description": "We recommend pinning Zerion to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "rainbow": {
      "qr_code": {
        "step1": {
          "title": "Open the Rainbow app",
          "description": "We recommend putting Rainbow on your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "You can easily backup your wallet using our backup feature on your phone."
        },
        "step3": {
          "title": "Tap the scan button",
          "description": "After you scan, a connection prompt will appear for you to connect your wallet."
        }
      }
    },

    "enkrypt": {
      "extension": {
        "step1": {
          "description": "We recommend pinning Enkrypt Wallet to your taskbar for quicker access to your wallet.",
          "title": "Install the Enkrypt Wallet extension"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension.",
          "title": "Refresh your browser"
        }
      }
    },

    "frame": {
      "extension": {
        "step1": {
          "description": "We recommend pinning Frame to your taskbar for quicker access to your wallet.",
          "title": "Install Frame & the companion extension"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension.",
          "title": "Refresh your browser"
        }
      }
    },

    "one_key": {
      "extension": {
        "step1": {
          "title": "Install the OneKey Wallet extension",
          "description": "We recommend pinning OneKey Wallet to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "paraswap": {
      "qr_code": {
        "step1": {
          "title": "Open the ParaSwap app",
          "description": "Add ParaSwap Wallet to your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap the QR icon and scan",
          "description": "Tap the QR icon on your homescreen, scan the code and confirm the prompt to connect."
        }
      }
    },

    "phantom": {
      "extension": {
        "step1": {
          "title": "Install the Phantom extension",
          "description": "We recommend pinning Phantom to your taskbar for easier access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret recovery phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "rabby": {
      "extension": {
        "step1": {
          "title": "Install the Rabby extension",
          "description": "We recommend pinning Rabby to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "ronin": {
      "qr_code": {
        "step1": {
          "description": "We recommend putting Ronin Wallet on your home screen for quicker access.",
          "title": "Open the Ronin Wallet app"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the scan button"
        }
      },

      "extension": {
        "step1": {
          "description": "We recommend pinning Ronin Wallet to your taskbar for quicker access to your wallet.",
          "title": "Install the Ronin Wallet extension"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension.",
          "title": "Refresh your browser"
        }
      }
    },

    "ramper": {
      "extension": {
        "step1": {
          "title": "Install the Ramper extension",
          "description": "We recommend pinning Ramper to your taskbar for easier access to your wallet."
        },
        "step2": {
          "title": "Create a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "safeheron": {
      "extension": {
        "step1": {
          "title": "Install the Core extension",
          "description": "We recommend pinning Safeheron to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "taho": {
      "extension": {
        "step1": {
          "title": "Install the Taho extension",
          "description": "We recommend pinning Taho to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "wigwam": {
      "extension": {
        "step1": {
          "title": "Install the Wigwam extension",
          "description": "We recommend pinning Wigwam to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "talisman": {
      "extension": {
        "step1": {
          "title": "Install the Talisman extension",
          "description": "We recommend pinning Talisman to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import an Ethereum Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your recovery phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "ctrl": {
      "extension": {
        "step1": {
          "title": "Install the CTRL Wallet extension",
          "description": "We recommend pinning CTRL Wallet to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "zeal": {
      "qr_code": {
        "step1": {
          "title": "Open the Zeal app",
          "description": "Add Zeal Wallet to your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap the QR icon and scan",
          "description": "Tap the QR icon on your homescreen, scan the code and confirm the prompt to connect."
        }
      },
      "extension": {
        "step1": {
          "title": "Install the Zeal extension",
          "description": "We recommend pinning Zeal to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "safepal": {
      "extension": {
        "step1": {
          "title": "Install the SafePal Wallet extension",
          "description": "Click at the top right of your browser and pin SafePal Wallet for easy access."
        },
        "step2": {
          "title": "Create or Import a wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up SafePal Wallet, click below to refresh the browser and load up the extension."
        }
      },
      "qr_code": {
        "step1": {
          "title": "Open the SafePal Wallet app",
          "description": "Put SafePal Wallet on your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap WalletConnect in Settings",
          "description": "Choose New Connection, then scan the QR code and confirm the prompt to connect."
        }
      }
    },

    "desig": {
      "extension": {
        "step1": {
          "title": "Install the Desig extension",
          "description": "We recommend pinning Desig to your taskbar for easier access to your wallet."
        },
        "step2": {
          "title": "Create a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "subwallet": {
      "extension": {
        "step1": {
          "title": "Install the SubWallet extension",
          "description": "We recommend pinning SubWallet to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your recovery phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      },
      "qr_code": {
        "step1": {
          "title": "Open the SubWallet app",
          "description": "We recommend putting SubWallet on your home screen for quicker access."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Tap the scan button",
          "description": "After you scan, a connection prompt will appear for you to connect your wallet."
        }
      }
    },

    "clv": {
      "extension": {
        "step1": {
          "title": "Install the CLV Wallet extension",
          "description": "We recommend pinning CLV Wallet to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      },
      "qr_code": {
        "step1": {
          "title": "Open the CLV Wallet app",
          "description": "We recommend putting CLV Wallet on your home screen for quicker access."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Tap the scan button",
          "description": "After you scan, a connection prompt will appear for you to connect your wallet."
        }
      }
    },

    "okto": {
      "qr_code": {
        "step1": {
          "title": "Open the Okto app",
          "description": "Add Okto to your home screen for quick access"
        },
        "step2": {
          "title": "Create an MPC Wallet",
          "description": "Create an account and generate a wallet"
        },
        "step3": {
          "title": "Tap WalletConnect in Settings",
          "description": "Tap the Scan QR icon at the top right and confirm the prompt to connect."
        }
      }
    },

    "ledger": {
      "desktop": {
        "step1": {
          "title": "Open the Ledger Live app",
          "description": "We recommend putting Ledger Live on your home screen for quicker access."
        },
        "step2": {
          "title": "Set up your Ledger",
          "description": "Set up a new Ledger or connect to an existing one."
        },
        "step3": {
          "title": "Connect",
          "description": "A connection prompt will appear for you to connect your wallet."
        }
      },
      "qr_code": {
        "step1": {
          "title": "Open the Ledger Live app",
          "description": "We recommend putting Ledger Live on your home screen for quicker access."
        },
        "step2": {
          "title": "Set up your Ledger",
          "description": "You can either sync with the desktop app or connect your Ledger."
        },
        "step3": {
          "title": "Scan the code",
          "description": "Tap WalletConnect then Switch to Scanner. After you scan, a connection prompt will appear for you to connect your wallet."
        }
      }
    },

    "valora": {
      "qr_code": {
        "step1": {
          "title": "Open the Valora app",
          "description": "We recommend putting Valora on your home screen for quicker access."
        },
        "step2": {
          "title": "Create or import a wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap the scan button",
          "description": "After you scan, a connection prompt will appear for you to connect your wallet."
        }
      }
    },

    "gate": {
      "qr_code": {
        "step1": {
          "title": "Open the Gate app",
          "description": "We recommend putting Gate on your home screen for quicker access."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap the scan button",
          "description": "After you scan, a connection prompt will appear for you to connect your wallet."
        }
      },
      "extension": {
        "step1": {
          "title": "Install the Gate extension",
          "description": "We recommend pinning Gate to your taskbar for easier access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret recovery phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "gemini": {
      "qr_code": {
        "step1": {
          "title": "Open keys.gemini.com",
          "description": "Visit keys.gemini.com on your mobile browser - no app download required."
        },
        "step2": {
          "title": "Create Your Wallet Instantly",
          "description": "Set up your smart wallet in seconds using your device's built-in authentication."
        },
        "step3": {
          "title": "Scan to Connect",
          "description": "Scan the QR code to instantly connect your wallet - it just works."
        }
      },
      "extension": {
        "step1": {
          "title": "Go to keys.gemini.com",
          "description": "No extensions or downloads needed - your wallet lives securely in the browser."
        },
        "step2": {
          "title": "One-Click Setup",
          "description": "Create your smart wallet instantly with passkey authentication - easier than any wallet out there."
        },
        "step3": {
          "title": "Connect and Go",
          "description": "Approve the connection and you're ready - the unopinionated wallet that just works."
        }
      }
    },

    "xportal": {
      "qr_code": {
        "step1": {
          "description": "Put xPortal on your home screen for faster access to your wallet.",
          "title": "Open the xPortal app"
        },
        "step2": {
          "description": "Create a wallet or import an existing one.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the Scan QR button"
        }
      }
    },

    "mew": {
      "qr_code": {
        "step1": {
          "description": "We recommend putting MEW Wallet on your home screen for quicker access.",
          "title": "Open the MEW Wallet app"
        },
        "step2": {
          "description": "You can easily backup your wallet using the cloud backup feature.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the scan button"
        }
      }
    },

    "zilpay": {
      "qr_code": {
        "step1": {
          "title": "Open the ZilPay app",
          "description": "Add ZilPay to your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap the scan button",
          "description": "After you scan, a connection prompt will appear for you to connect your wallet."
        }
      }
    },

    "nova": {
      "qr_code": {
        "step1": {
          "title": "Open the Nova Wallet app",
          "description": "Add Nova Wallet to your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap the scan button",
          "description": "After you scan, a connection prompt will appear for you to connect your wallet."
        }
      }
    },

    "meco": {
      "qr_code": {
        "step1": {
          "title": "Open the MeCo Wallet app",
          "description": "Put MeCo Wallet on your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap the scan button",
          "description": "After you scan, a connection prompt will appear for you to connect your wallet."
        }
      }
    },

    "anchorage_digital": {
      "extension": {
        "step1": {
          "title": "Install the Anchorage Digital extension",
          "description": "We recommend pinning Anchorage Digital to your taskbar for easier access to your wallet."
        },
        "step2": {
          "title": "Scan the QR code to login",
          "description": "Securely connect your organization's wallets to dApps with institutional-grade security."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you log in, click below to refresh the browser and load up the extension."
        }
      }
    }
  }
}
`},87403:(e,t,r)=>{r.d(t,{N:()=>n,V:()=>i});var o=r(4038);class n extends o.C{constructor(){super("Provider not found."),Object.defineProperty(this,"name",{enumerable:!0,configurable:!0,writable:!0,value:"ProviderNotFoundError"})}}class i extends o.C{constructor({connector:e}){super(`"${e.name}" does not support programmatic chain switching.`),Object.defineProperty(this,"name",{enumerable:!0,configurable:!0,writable:!0,value:"SwitchChainNotSupportedError"})}}},88728:(e,t,r)=>{r.d(t,{v:()=>c});var o=r(49988),n=r(64200),i=r(72242),a=r(47002),s=r(5573),l=r(42482);function c(e={}){let{address:t,query:r={}}=e,u=(0,l.U)(e),p=(0,s.i)({config:u}),d=function(e,t={}){return{async queryFn({queryKey:t}){let{address:r,scopeKey:i,...a}=t[1];if(!r)throw Error("address is required");return function(e,t){let{chainId:r,...i}=t,a=e.getClient({chainId:r});return(0,n.T)(a,o.s,"getEnsName")(i)}(e,{...a,address:r})},queryKey:function(e={}){return["ensName",(0,i.xO)(e)]}(t)}}(u,{...e,chainId:e.chainId??p}),h=!!(t&&(r.enabled??!0));return(0,a.IT)({...r,...d,enabled:h})}},91514:(e,t,r)=>{r.d(t,{r:()=>o});let o=(0,r(39606).x)({id:1,name:"Ethereum",nativeCurrency:{name:"Ether",symbol:"ETH",decimals:18},blockTime:12e3,rpcUrls:{default:{http:["https://ethereum.reth.rs/rpc"]}},blockExplorers:{default:{name:"Etherscan",url:"https://etherscan.io",apiUrl:"https://api.etherscan.io/api"}},contracts:{ensUniversalResolver:{address:"0xeeeeeeee14d718c2b47d9923deab1335e144eeee",blockCreated:0x16041f6},multicall3:{address:"0xca11bde05977b3631167028862be2a173976ca11",blockCreated:0xdb04c1}}})}}]);