import javascript
private import semmle.javascript.dataflow.internal.FlowSteps

class LabelSourcePathNode extends DataFlow::SourcePathNode {
  override string toString() {
    result =
      nd.toString() + " | " + getLabel()
  }

  string getLabel() {
    result = concat(DataFlow::FlowLabel lbl | cfg.isSource(nd, lbl) | "#" + lbl, " ")
  }
}

class LabelMidPathNode extends DataFlow::MidPathNode {
  override string toString() {
    result =
      nd.toString() +
        // " {" +
        // concat(DataFlow::Node n | n = nd  | n.getAQlClass(), " " ) +
        // "}" +
        " | " +
        concat(DataFlow::MidPathNode n, PathSummary s |
          n.wraps(nd, cfg, s)
        |
          "#" + s.getEndLabel(), " "
        )
  }
}

class LabelSinkPathNode extends DataFlow::SinkPathNode {
  override string toString() {
    result =
      nd.toString() +
        // " {" +
        // concat(DataFlow::Node n | n = nd  | n.getAQlClass(), " " ) +
        // "}" +
        " | " + concat(DataFlow::FlowLabel lbl | cfg.isSink(nd, lbl) | "#" + lbl, " ")
  }
}
