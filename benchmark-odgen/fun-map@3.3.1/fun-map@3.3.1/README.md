# fun-map

  functional utilities for pretending that JS objects are Clojure string maps.
  like Clojure's impure operations on transients, there are a few mutating functions available with `M` as postfix (for DANGEROUS MUTABLE STUFF, obviously)
  this is partially an experiment in how much Clojure I can bring to JS.

## hashmap(…keyvals)
## get(obj, key)
## getIn(obj, keys)
## assoc(obj, key, value, …keyvals)
## assocIn(obj, keys, value)
## dissoc(obj, key, …keys)
## merge(obj, …objs)
## zipmap(keys, values)
## selectKeys(obj, keys)
## keys(obj)
## vals(obj)
## keyvals(obj)

## DANGEROUS IMPURE THINGS
### assocM(obj, key, value, …keyvals)
### assocInM(obj, keys, value)
### dissocM(obj, key, …keys)
### mergeM(obj, …objs)
