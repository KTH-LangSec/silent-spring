/**
 * @name PrototypePolluting
 * @kind path-problem
 * @problem.severity warning
 * @precision high
 * @id js/prototype-polluting
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
from PrototypePolluting::Configuration cfg, DataFlow::PathNode source, DataFlow::PathNode sink
where cfg.hasFlowPath(source, sink)
select sink, source, sink,
  "This assignment may alter Object.prototype if a malicious '__proto__' string is injected from $@.",
  source.getNode(), "here"
