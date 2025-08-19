# form-data-serializer

Extendable JSON to FormData serializer. 

## Purpose

Data is transferred over the network in several ways; one of the most popular methods is via JSON.

However, JSON only supports serialization of a few primitives, and notably lacks good `File` and `Blob` support. This package aims to solve this issue by making everything a `FormData` object, providing native file serialization, and allowing you to customise how you want to serialize non primitive data (`Date`, `BigInt`, `ArrayBuffer`, etc...).

## Usage

todo