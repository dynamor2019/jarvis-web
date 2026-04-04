module.exports=[193695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},270406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},918622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},556704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},832319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},324725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},254799,(e,t,r)=>{t.exports=e.x("crypto",()=>require("crypto"))},285098,e=>{"use strict";var t=e.i(747909),r=e.i(174017),a=e.i(996250),n=e.i(759756),s=e.i(561916),o=e.i(114444),i=e.i(837092),l=e.i(869741),d=e.i(316795),c=e.i(487718),p=e.i(995169),u=e.i(47587),h=e.i(666012),m=e.i(570101),x=e.i(626937),f=e.i(10372),g=e.i(193695);e.i(52474);var v=e.i(600220),b=e.i(89171),R=e.i(254799);async function w(e){try{let{searchParams:t}=new URL(e.url),r=t.get("ticket"),a=t.get("action"),n=String(t.get("referralCode")||"").trim(),s=String(t.get("mockAccount")||"").trim();if(!r)return b.NextResponse.json({success:!1,error:"缺少ticket参数"},{status:400});let o=globalThis.wechatTickets||{},i=o[r];if(!i){if("confirm"===a)return b.NextResponse.json({success:!1,error:"ticket已过期或不存在"},{status:400});return new b.NextResponse("<html><body><h1>登录失败</h1><p>ticket已过期或不存在</p></body></html>",{headers:{"Content-Type":"text/html; charset=utf-8"}})}let l=s||process.env.WECHAT_DEV_OPENID||`${e.headers.get("user-agent")||"ua"}|${e.headers.get("x-forwarded-for")||""}`,d=(0,R.createHash)("sha256").update(l).digest("hex").slice(0,20),c={openid:`mock_openid_${d}`,nickname:"测试用户",headimgurl:"https://api.dicebear.com/7.x/avataaars/svg?seed=wechat",unionid:`mock_unionid_${d}`},p=String(i.referralCode||"").trim(),u=n||p,h=u?`Referral code: ${u} (both users get +5000 Token)`:"No referral code provided";if(o[r]={...i,referralCode:u||void 0,status:"success",userInfo:{email:`wechat_${c.openid}@jarvis.com`,username:`wx_${c.openid.substr(-8)}`,name:c.nickname,avatar:c.headimgurl,openid:c.openid,unionid:c.unionid},scannedAt:Date.now()},"confirm"===a)return b.NextResponse.json({success:!0,message:"登录成功",referralCode:u||null});return new b.NextResponse(`<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>登录成功</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 3rem;
            border-radius: 1rem;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 400px;
          }
          .success-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 1.5rem;
            background: #10b981;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .checkmark {
            width: 40px;
            height: 40px;
            border: 4px solid white;
            border-top: none;
            border-left: none;
            transform: rotate(45deg);
            margin-top: -10px;
          }
          h1 {
            color: #1f2937;
            margin: 0 0 1rem;
          }
          p {
            color: #6b7280;
            margin: 0 0 2rem;
          }
          .info {
            background: #f3f4f6;
            padding: 1rem;
            border-radius: 0.5rem;
            margin-bottom: 1.5rem;
            text-align: left;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            margin: 0.5rem 0;
            font-size: 0.875rem;
          }
          .label {
            color: #6b7280;
          }
          .value {
            color: #1f2937;
            font-weight: 500;
          }
          .note {
            font-size: 0.875rem;
            color: #9ca3af;
            margin-top: 1rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">
            <div class="checkmark"></div>
          </div>
          <h1>登录成功！</h1>
          <p>微信扫码登录已完成</p>
          <div class="info">
            <div class="info-item">
              <span class="label">用户名：</span>
              <span class="value">${c.nickname}</span>
            </div>
            <div class="info-item">
              <span class="label">OpenID：</span>
              <span class="value">${c.openid.substr(0,20)}...</span>
            </div>
            <div class="info-item">
              <span class="label">Referral</span>
              <span class="value">${u||"N/A"}</span>
            </div>
          </div>
          <p class="note" style="color:#92400e;background:#fffbeb;border:1px solid #fde68a;padding:8px 10px;border-radius:8px;">${h}</p>
          <p class="note">请返回登录页面，系统将自动完成登录</p>
          <p class="note" style="margin-top: 0.5rem;">（开发模式 - 模拟登录）</p>
        </div>
      </body>
      </html>`,{status:200,headers:{"Content-Type":"text/html; charset=utf-8"}})}catch(t){console.error("模拟微信登录失败:",t);let e=t instanceof Error?t.message:"未知错误";return new b.NextResponse(`<html><body><h1>登录失败</h1><p>${e}</p></body></html>`,{headers:{"Content-Type":"text/html; charset=utf-8"}})}}e.s(["GET",()=>w],23423);var y=e.i(23423);let E=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/auth/wechat/dev/route",pathname:"/api/auth/wechat/dev",filename:"route",bundlePath:""},distDir:".next_build",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/auth/wechat/dev/route.ts",nextConfigOutput:"standalone",userland:y}),{workAsyncStorage:C,workUnitAsyncStorage:k,serverHooks:A}=E;function T(){return(0,a.patchFetch)({workAsyncStorage:C,workUnitAsyncStorage:k})}async function N(e,t,a){E.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let b="/api/auth/wechat/dev/route";b=b.replace(/\/index$/,"")||"/";let R=await E.prepare(e,t,{srcPage:b,multiZoneDraftMode:!1});if(!R)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:w,params:y,nextConfig:C,parsedUrl:k,isDraftMode:A,prerenderManifest:T,routerServerContext:N,isOnDemandRevalidate:_,revalidateOnlyGenerated:P,resolvedPathname:S,clientReferenceManifest:j,serverActionsManifest:O}=R,q=(0,l.normalizeAppPath)(b),$=!!(T.dynamicRoutes[q]||T.routes[S]),H=async()=>((null==N?void 0:N.render404)?await N.render404(e,t,k,!1):t.end("This page could not be found"),null);if($&&!A){let e=!!T.routes[S],t=T.dynamicRoutes[q];if(t&&!1===t.fallback&&!e){if(C.experimental.adapterPath)return await H();throw new g.NoFallbackError}}let I=null;!$||E.isDev||A||(I="/index"===(I=S)?"/":I);let D=!0===E.isDev||!$,U=$&&!D;O&&j&&(0,o.setReferenceManifestsSingleton)({page:b,clientReferenceManifest:j,serverActionsManifest:O,serverModuleMap:(0,i.createServerModuleMap)({serverActionsManifest:O})});let M=e.method||"GET",F=(0,s.getTracer)(),K=F.getActiveScopeSpan(),B={params:y,prerenderManifest:T,renderOpts:{experimental:{authInterrupts:!!C.experimental.authInterrupts},cacheComponents:!!C.cacheComponents,supportsDynamicResponse:D,incrementalCache:(0,n.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:C.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a)=>E.onRequestError(e,t,a,N)},sharedContext:{buildId:w}},L=new d.NodeNextRequest(e),G=new d.NodeNextResponse(t),V=c.NextRequestAdapter.fromNodeNextRequest(L,(0,c.signalFromNodeResponse)(t));try{let o=async e=>E.handle(V,B).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=F.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==p.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${M} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t)}else e.updateName(`${M} ${b}`)}),i=!!(0,n.getRequestMeta)(e,"minimalMode"),l=async n=>{var s,l;let d=async({previousCacheEntry:r})=>{try{if(!i&&_&&P&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let s=await o(n);e.fetchMetrics=B.renderOpts.fetchMetrics;let l=B.renderOpts.pendingWaitUntil;l&&a.waitUntil&&(a.waitUntil(l),l=void 0);let d=B.renderOpts.collectedTags;if(!$)return await (0,h.sendResponse)(L,G,s,B.renderOpts.pendingWaitUntil),null;{let e=await s.blob(),t=(0,m.toNodeOutgoingHttpHeaders)(s.headers);d&&(t[f.NEXT_CACHE_TAGS_HEADER]=d),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==B.renderOpts.collectedRevalidate&&!(B.renderOpts.collectedRevalidate>=f.INFINITE_CACHE)&&B.renderOpts.collectedRevalidate,a=void 0===B.renderOpts.collectedExpire||B.renderOpts.collectedExpire>=f.INFINITE_CACHE?void 0:B.renderOpts.collectedExpire;return{value:{kind:v.CachedRouteKind.APP_ROUTE,status:s.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await E.onRequestError(e,t,{routerKind:"App Router",routePath:b,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:U,isOnDemandRevalidate:_})},N),t}},c=await E.handleResponse({req:e,nextConfig:C,cacheKey:I,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:T,isRoutePPREnabled:!1,isOnDemandRevalidate:_,revalidateOnlyGenerated:P,responseGenerator:d,waitUntil:a.waitUntil,isMinimalMode:i});if(!$)return null;if((null==c||null==(s=c.value)?void 0:s.kind)!==v.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==c||null==(l=c.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});i||t.setHeader("x-nextjs-cache",_?"REVALIDATED":c.isMiss?"MISS":c.isStale?"STALE":"HIT"),A&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let p=(0,m.fromNodeOutgoingHttpHeaders)(c.value.headers);return i&&$||p.delete(f.NEXT_CACHE_TAGS_HEADER),!c.cacheControl||t.getHeader("Cache-Control")||p.get("Cache-Control")||p.set("Cache-Control",(0,x.getCacheControlHeader)(c.cacheControl)),await (0,h.sendResponse)(L,G,new Response(c.value.body,{headers:p,status:c.value.status||200})),null};K?await l(K):await F.withPropagatedContext(e.headers,()=>F.trace(p.BaseServerSpan.handleRequest,{spanName:`${M} ${b}`,kind:s.SpanKind.SERVER,attributes:{"http.method":M,"http.target":e.url}},l))}catch(t){if(t instanceof g.NoFallbackError||await E.onRequestError(e,t,{routerKind:"App Router",routePath:q,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:U,isOnDemandRevalidate:_})}),$)throw t;return await (0,h.sendResponse)(L,G,new Response(null,{status:500})),null}}e.s(["handler",()=>N,"patchFetch",()=>T,"routeModule",()=>E,"serverHooks",()=>A,"workAsyncStorage",()=>C,"workUnitAsyncStorage",()=>k],285098)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__096d14f3._.js.map