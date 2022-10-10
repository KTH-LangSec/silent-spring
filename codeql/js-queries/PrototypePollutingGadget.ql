/**
 * @name PrototypePollutingGadget
 * @kind path-problem
 * @problem.severity warning
 * @precision high
 * @id js/prototype-polluting-gadget
 */

import javascript
import DataFlow::PathGraph
import AccessPath::DominatingPaths
import PrototypePollutingCommon
import MultiLabelPathNodes

import semmle.javascript.dataflow.internal.CallGraphs
import semmle.javascript.dataflow.Nodes

//import semmle.javascript.explore.ForwardDataFlow
//import semmle.javascript.explore.BackwardDataFlow


predicate propagationAnArgumentListIncludes(string funcName) {
  funcName = [
    "_toUSVString",
    "StringPrototypeCharAt",
    "StringPrototypeMatch",
    "StringPrototypeReplace",
    "RegExpPrototypeSymbolReplace",
    "RegExpPrototypeTest", 
    "RegExpPrototypeExec",
    "Url"
  ]
}

predicate propagationArgumentListIncludes(string funcName, int i) {
  i = 0 and funcName = [
    "decodeURIComponent",
    "_domainToASCII",
    "_domainToUnicode",
    "StringPrototypeIncludes",
    "StringPrototypeSplit",
    "StringPrototypeEndsWith",
    "StringPrototypeStartsWith",
    "pathToFileURL",
    "StringPrototypeLastIndexOf",
    "StringPrototypeIndexOf",
    "JSONStringify",
    "createFromString",
    "StringPrototypeToLowerCase", 
    "StringPrototypeToUpperCase",
    "internalModuleReadJSON",
    "RegExpPrototypeToString",
    "DatePrototypeToString",
    "DatePrototypeToISOString",
    "FunctionPrototypeToString",
    "ErrorPrototypeToString"
  ]
  or
  i = 1 and funcName = [
    "StringPrototypeIncludes",
    "StringPrototypeEndsWith",
    "StringPrototypeStartsWith",
    "StringPrototypeLastIndexOf",
    "StringPrototypeIndexOf"
  ]
}

predicate taintPropagationAnArgument(
  DataFlow::Node pred, DataFlow::Node succ, string funcName
) {
  exists(DataFlow::InvokeNode call |
    call.getCalleeName() = funcName
    |
    pred = call.getAnArgument() and
    succ = call
  )
}

predicate taintPropagationArgument(
  DataFlow::Node pred, DataFlow::Node succ, string funcName, int i
) {
  exists(DataFlow::InvokeNode call |
    call.getCalleeName() = funcName
    |
    pred = call.getArgument(i) and
    succ = call
  )
}

predicate internalMethodMap(string internalMethodName, string standardMethodName) {
  internalMethodName = "ArrayPrototypeUnshift" and standardMethodName = "unshift" or
  internalMethodName = "ArrayPrototypeJoin" and standardMethodName = "join" or
  internalMethodName = "ArrayPrototypeSlice" and standardMethodName = "slice" or
  internalMethodName = "ArrayPrototypeSplice" and standardMethodName = "splice" or
  internalMethodName = "ArrayPrototypePush" and standardMethodName = "push" or
  internalMethodName = "ArrayPrototypeReduce" and standardMethodName = "reduce" or
  internalMethodName = "ArrayPrototypeConcat" and standardMethodName = "concat" or 
  internalMethodName = "ArrayPrototypeShift" and standardMethodName = "shift" or 
  internalMethodName = "ArrayPrototypeIncludes" and standardMethodName = "includes" or
  internalMethodName = "TypedArrayPrototypeSet" and standardMethodName = "set" or 
  internalMethodName = "TypedArrayPrototypeFill" and standardMethodName = "fill" or 
  internalMethodName = "TypedArrayPrototypeGetLength" and standardMethodName = "getLength" or 
  
  internalMethodName = "FunctionPrototypeBind" and standardMethodName = "bind" or 
  internalMethodName = "FunctionPrototypeCall" and standardMethodName = "call" or 

  internalMethodName = "ReflectApply" and standardMethodName = "apply" or

  internalMethodName = "SetPrototypeGetSize" and standardMethodName = "getSize" or
  internalMethodName = "SetPrototypeValues" and standardMethodName = "values" or

  internalMethodName = "MapPrototypeEntries" and standardMethodName = "entries" or
  internalMethodName = "MapPrototypeGetSize" and standardMethodName = "getSize" or

  internalMethodName = "ObjectPrototypeHasOwnProperty" and standardMethodName = "hasOwnProperty" or
  internalMethodName = "ObjectPrototypePropertyIsEnumerable" and standardMethodName = "propertyIsEnumerable" or

  internalMethodName = "DatePrototypeGetTime" and standardMethodName = "getTime" or
  internalMethodName = "DatePrototypeGetTime" and standardMethodName = "getTime" or

  internalMethodName = "StringPrototypeCharCodeAt" and standardMethodName = "charCodeAt" or
  internalMethodName = "StringPrototypeSlice" and standardMethodName = "slice" or
  internalMethodName = "StringPrototypePadStart" and standardMethodName = "padStart" or
  internalMethodName = "StringPrototypeNormalize" and standardMethodName = "normalize" //or
}

predicate internalStaticMethodMap(string internalMethodName, string standardMethodName, string standardReceiverName) {
  internalMethodName = "ArrayIsArray" and standardMethodName = "IsArray" and standardReceiverName = "Array" or

  internalMethodName = "NumberIsInteger" and standardMethodName = "isInteger" and standardReceiverName = "Number" or
  internalMethodName = "ReflectOwnKeys" and standardMethodName = "keys" and standardReceiverName = "Object"    
}

predicate isInternalInvocation(DataFlow::InvokeNode invoke) {
  not exists(DataFlow::FunctionNode f | f = invoke.getCalleeNode().getABoundFunctionValue(_))
}

predicate blackListIncludes(DataFlow::InvokeNode invoke) {
  exists(string name | name = invoke.getCalleeName() |
    internalMethodMap(name, _) or
    internalMethodMap(_, name) or
    internalStaticMethodMap(name, _, _) or
    internalStaticMethodMap(_, name, _) or
    propagationAnArgumentListIncludes(name) or
    propagationArgumentListIncludes(name, _) or

    //name.matches("%Prototype%") or    // TODO: for testing only
    name.matches("ERR_%") or
    name = [
      "validateObject",
      "validateString",
      "validateArray",
      "validateBuffer",
      "validateInt32",
      "validateUint32",
      "validateFunction",
      "validateOneOf",
      "getValidatedPath",
      "errnoException",
      "isArrayBufferView",
      "internalGetConstructorName",
      "stylize",
      "getProxyDetails",
      "getPromiseDetails",
      "isNativeError",
      "isStringObject",
      "isBooleanObject",
      "isBigIntObject",
      "isGeneratorFunction",
      "isAsyncFunction",
      "isModuleNamespaceObject" ,
      "isSet",
      "isMap",
      "isMapIterator",
      "isSetIterator",
      "isArgumentsObject",
      "isRegExp",
      "isDate",
      "isAnyArrayBuffer",
      "isArrayBuffer",
      "isDataView",
      "isPromise",
      "isWeakSet",
      "isWeakMap",
      "isBoxedPrimitive",
      "isExternal",
      "isNumberObject",
      "getExternalValue",
      "previewEntries",
      "getOwnNonIndexProperties",
      "ObjectGetOwnPropertyNames",
      "ObjectGetOwnPropertyDescriptor",
      "ObjectGetOwnPropertySymbols",
      "getOwnNonIndexProperties",
      "BigIntPrototypeToString",
      "TypedArrayPrototypeGetSymbolToStringTag",
      ////////////////////////////////////////////
      "emitWarning",
      "ErrorCaptureStackTrace",
      "Error",
      "toString",
      "includes",
      "indexOf",
      "has",
      "add",
      "set",
      "get",
      "bind",
      "write",
      "Uint8Array",
      "RegExp",   
      "String",
      "Array",
      "Boolean",
      "Number",
      "MathMin",
      "MathMax",
      "ObjectIs",
      "ObjectKeys",
      // validated:
      "byteLength",
      "error",
      "validatePath",
      "lstat",
      "stat",
      "uvException",
      "allocate",
      "assertIntegrity",
      "assertSize",
      "parse",   
      "internalModuleStat",
      "fstat",
      "getValidatedFd",
      "_setHiddenValue",
      "inspectorWrapper",
      "nextTick",
      "JSONParse",
      "ObjectDefineProperty",
      "ObjectSetPrototypeOf",
      "ObjectGetPrototypeOf",
      "SymbolPrototypeToString"
    ]
  )
  or
  invoke.getFile().getBaseName() = "buffer.js" and // replace to full path 
  invoke.getCalleeNode().asExpr() instanceof SuperExpr
}

private class InternalMethodCallNode extends DataFlow::Impl::ExplicitCallNode, DataFlow::Impl::MethodCallNodeDef {
  string methodName;

  InternalMethodCallNode() {
    internalMethodMap(super.getCalleeName(), methodName)
  }

  override DataFlow::Node getReceiver() { 
    result = super.getArgument(0) 
  }

  override string getMethodName() { result = methodName }

  override string getCalleeName() { result = methodName }

  override DataFlow::Node getArgument(int i) {
    i >= 0 and result = super.getArgument(i + 1)
  }

  override DataFlow::Node getAnArgument() {
    result = super.getAnArgument() and
    result != this.getReceiver()
  }

  override int getNumArgument() { result >= 0 and result = super.getNumArgument() - 1 }
}

private class InternalStaticMethodCallNode extends DataFlow::Impl::ExplicitCallNode, DataFlow::Impl::MethodCallNodeDef {
  string methodName;
  string receiverName;

  InternalStaticMethodCallNode() {
    internalStaticMethodMap(super.getCalleeName(), methodName, receiverName)
  }

  override DataFlow::Node getReceiver() { none() }

  override string getMethodName() { result = methodName }

  override string getCalleeName() { result = methodName }
}


class ReceiverLabel extends DataFlow::FlowLabel {
  ReceiverLabel() { this = "receiver" }
}

class PollutedLabel extends DataFlow::FlowLabel {
  PollutedLabel() { this = "polluted" }
}

class CallFlowLabel extends DataFlow::FlowLabel {
  CallFlowLabel() { this = "callflow" }
}

string getPropertyNameFromSymbol(DataFlow::PropRead read) {
  exists(DataFlow::InvokeNode invoke |
    read.getPropertyNameExpr().flow().getALocalSource() = invoke and
    invoke.getCalleeName() = "Symbol" and
    result = invoke.getArgument(0).asExpr().getStringValue()
  )
}

string resolvePropertyName(DataFlow::PropRead read) {
  result = read.getPropertyName() 
  or 
  result = getPropertyNameFromSymbol(read)
}


class ConfigurationGDS extends TaintTracking::Configuration {
  ConfigurationGDS() { this = "PrototypePollutingGadgetSimple" }

  DataFlow::FunctionNode getAnExportedFunction() {
    exists(DataFlow::FunctionNode f, DataFlow::Node exportedValue |
      exportedValue = any(Module m).getAnExportedValue(_).getALocalSource() and
      (
        f = exportedValue.getAFunctionValue()
        or
        exists(DataFlow::ClassNode c | c = exportedValue |
              (f = c.getAnInstanceMethod() or f = c.getAStaticMethod()) and
              forall(MethodDeclaration m | f.asExpr() = m.getBody() | m.isPublic())
        )
      ) and 
      not f.getFile().getBaseName() = "inspector.js" and
      not f.getFile().getBaseName() = "repl.js" and
      not f.getFile().getBaseName() = "run_main.js" and
      not exists(string funcName | 
        funcName = f.getName() |
        funcName.matches("\\_%") // we assume that only internal functions have a name with the firts character `_`
      ) and
      result = f
    )
  }

///*
  override predicate isSource(DataFlow::Node node, DataFlow::FlowLabel lbl) { 
    exists(DataFlow::FunctionNode func | func = node.(DataFlow::FunctionNode) |
      func = getAnExportedFunction()
    ) and 
    lbl instanceof CallFlowLabel
  }

  override predicate isCallFlowStep(DataFlow::FlowLabel lbl) {
    lbl instanceof CallFlowLabel
  }


  override predicate isSink(DataFlow::Node node, DataFlow::FlowLabel lbl) {
    exists(DataFlow::InvokeNode invoke |
      isInternalInvocation(invoke) and not blackListIncludes(invoke)
      |
      invoke.getAnArgument() = node
    ) and 
    (
      lbl instanceof PollutedLabel
      or 
      lbl instanceof ReceiverLabel
    )
  }

  DataFlow::Node getAllRecivers(DataFlow::Node node) {
    result = node 
    or
    result = getAllRecivers(node.(DataFlow::PropRead).getBase().getALocalSource())
  }

  predicate propagateLabeles(DataFlow::FlowLabel inlbl, DataFlow::FlowLabel outlbl) {
    inlbl instanceof PollutedLabel and outlbl instanceof PollutedLabel
    or
    inlbl instanceof ReceiverLabel and outlbl instanceof ReceiverLabel
  }

  override predicate isAdditionalFlowStep(
    DataFlow::Node pred, DataFlow::Node succ, 
    DataFlow::FlowLabel inlbl, DataFlow::FlowLabel outlbl
  ) {
    exists(DataFlow::PropRead read |
      resolvePropertyName(read) = "%PROP%" and
      pred.(DataFlow::FunctionNode) = read.getBasicBlock().getContainer().(Function).flow() and 
      succ = read and
      inlbl instanceof CallFlowLabel and
      outlbl instanceof PollutedLabel
    )
    or
    exists(string funcName, int i |
      propagationArgumentListIncludes(funcName, i)
      |
      taintPropagationArgument(pred, succ, funcName, i) and
      propagateLabeles(inlbl, outlbl)
    )
    or
    exists(string funcName|
      propagationAnArgumentListIncludes(funcName)
      |
      taintPropagationAnArgument(pred, succ, funcName) and
      propagateLabeles(inlbl, outlbl)
    )
    or
    exists(DataFlow::PropWrite write | 
      pred = write.getRhs() and
      not pred instanceof DataFlow::FunctionNode and
      succ = getAllRecivers(write.getBase().getALocalSource()) and
      (inlbl instanceof PollutedLabel or inlbl instanceof ReceiverLabel) and
      outlbl instanceof ReceiverLabel
    )
    or 
    exists(DataFlow::PropRead read |
      pred = read.getBase() and
      succ = read and
      not exists(resolvePropertyName(read)) and  // so we assume that this property can be the original tainted property
      inlbl instanceof ReceiverLabel and
      outlbl instanceof PollutedLabel
    )

    or
    TaintTracking::sharedTaintStep(pred, succ) and 
    propagateLabeles(inlbl, outlbl)
  }

  override predicate isSanitizerEdge(DataFlow::Node pred, DataFlow::Node succ, DataFlow::FlowLabel lbl) {
    exists(DataFlow::PropRead read |
      pred = read.getBase() and
      succ = read and
      lbl instanceof ReceiverLabel
    )
    or
    // ???
    exists(DataFlow::PropRead read, DataFlow::MethodCallNode method |
      method.getReceiver() = read and
      pred = read.getBase() and
      succ = read and
      (lbl instanceof ReceiverLabel or lbl instanceof PollutedLabel)
    )
    or
    super.isSanitizerEdge(pred, succ, lbl)
  }

}

string output(DataFlow::Node node) {
  if  (
        exists(node.(DataFlow::MethodCallNode).getReceiver()) and 
        exists(node.(DataFlow::MethodCallNode).getMethodName())
      )
  then result = node.(DataFlow::MethodCallNode).getReceiver().toString() + "." + node.(DataFlow::MethodCallNode).getMethodName()
  else if (exists(node.(DataFlow::InvokeNode).getCalleeName()))
  then result = node.(DataFlow::InvokeNode).getCalleeName()
  else if (exists(node.(DataFlow::FunctionNode).getName()))
  then result = node.(DataFlow::FunctionNode).getName()
  else result = node.toString() + " [?]"
}

string outputCsv(DataFlow::Node node) {
  if (exists(node.(DataFlow::MethodCallNode).getMethodName()))
  then result = node.(DataFlow::MethodCallNode).getMethodName()
  else if (exists(node.(DataFlow::InvokeNode).getCalleeName()))
  then result = node.(DataFlow::InvokeNode).getCalleeName()
  else if (exists(node.(DataFlow::FunctionNode).getName()))
  then result = node.(DataFlow::FunctionNode).getName()
  else result = node.toString() + " [?]"
}


from ConfigurationGDS cfg, LabelSourcePathNode source, DataFlow::PathNode sink, DataFlow::InvokeNode sinkInvoke 
where cfg.hasFlowPath(source, sink)
      and sinkInvoke.getAnArgument() = sink.getNode()
select  source, source, sink, 
        "$@ (" + source.getNode().getFile().getRelativePath() + ") -> [] -> $@", 
        source.getNode(), outputCsv(source.getNode()),
        sink.getNode(), outputCsv(sinkInvoke)
