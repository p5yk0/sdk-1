import {Methods} from "../models/route.js";
import express from "express";
import fileUpload from "express-fileupload";


// Applique un/des middlewares à un router
export function bindMiddlewares(middlewares, router) {
    if( middlewares !== null && middlewares !== undefined ) {
        for( let middleware of Array.isArray(middlewares) ? middlewares : [ middlewares ] ) {
            router.use(middleware);
        }
    }
}

// Défini des routes à partir d'un tableau d'objet Route
export function defineRoute(basePath, routes, router) {
    for( let route of routes ) {
        let handlers = [];
        if( route.method === Methods.POST ) {
            handlers.push(express.json());
            handlers.push(express.urlencoded({ extended: true }));
            handlers.push(fileUpload());
        }
        Array.isArray(route.handlers) ? handlers.push(...route.handlers) : handlers.push(route.handlers);
        router[route.method](route.url, ...handlers);
        console.log(route.method.toUpperCase(), basePath + route.url);
    }
}