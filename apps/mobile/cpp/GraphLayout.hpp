#pragma once

#include <vector>
#include <string>
#include <unordered_map>
#include <cmath>

namespace synapse {

struct LayoutNode {
    std::string id;
    float x;
    float y;
    float vx = 0.0f;
    float vy = 0.0f;
    float mass = 1.0f;
    bool fixed = false;
};

struct LayoutEdge {
    std::string source;
    std::string target;
    float length = 200.0f;
    float strength = 0.1f;
};

class GraphLayoutEngine {
public:
    GraphLayoutEngine() = default;

    void setNodes(const std::vector<LayoutNode>& nodes);
    void setEdges(const std::vector<LayoutEdge>& edges);

    // Runs N simulation steps with repulsion, spring attraction and damping
    void stepSimulation(int iterations = 50, float repulsion = 5000.0f, float damping = 0.85f);

    // Computes hierarchical level-based layout
    void computeHierarchical(float levelSpacing = 220.0f, float nodeSpacing = 280.0f);

    const std::vector<LayoutNode>& getNodes() const { return nodes_; }

private:
    std::vector<LayoutNode> nodes_;
    std::vector<LayoutEdge> edges_;
    std::unordered_map<std::string, size_t> nodeIndexMap_;

    void buildIndexMap();
};

} // namespace synapse
