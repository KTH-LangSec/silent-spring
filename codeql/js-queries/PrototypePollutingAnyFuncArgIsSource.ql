/**
 * @name PrototypePollutingAnyFuncArgIsSource
 * @kind path-problem
 * @problem.severity warning
 * @precision high
 * @id js/prototype-polluting-any-func-arg-is-source
 * @tags security
 *       external/cwe/cwe-078
 *       external/cwe/cwe-079
 *       external/cwe/cwe-094
 *       external/cwe/cwe-400
 *       external/cwe/cwe-915
 */

import javascript
import DataFlow::PathGraph
import PrototypePollutingCommon

//import semmle.javascript.explore.ForwardDataFlow
//import semmle.javascript.explore.BackwardDataFlow
class Configuration extends PrototypePolluting::Configuration {
  override predicate isSource(DataFlow::Node node) {
    exists(DataFlow::FunctionNode f | f.getAParameter() = node)
    or
    exists(ArgumentsVariable v | not exists(v.getADeclaration()) | v.getAnAccess().flow() = node)
  }
}

from Configuration cfg, DataFlow::PathNode source, DataFlow::PathNode sink
where cfg.hasFlowPath(source, sink) 
select sink, source, sink,
  "[ANY ARG] This assignment may alter Object.prototype if a malicious '__proto__' string is injected from $@.",
  source.getNode(), "here"
