#include "GraphLayout.hpp"
#include <queue>
#include <unordered_set>
#include <algorithm>

namespace synapse {

void GraphLayoutEngine::buildIndexMap() {
    nodeIndexMap_.clear();
    for (size_t i = 0; i < nodes_.size(); ++i) {
        nodeIndexMap_[nodes_[i].id] = i;
    }
}

void GraphLayoutEngine::setNodes(const std::vector<LayoutNode>& nodes) {
    nodes_ = nodes;
    buildIndexMap();
}

void GraphLayoutEngine::setEdges(const std::vector<LayoutEdge>& edges) {
    edges_ = edges;
}

void GraphLayoutEngine::stepSimulation(int iterations, float repulsion, float damping) {
    if (nodes_.empty()) return;

    for (int iter = 0; iter < iterations; ++iter) {
        // 1. Repulsion between all node pairs (Coulomb's Law)
        for (size_t i = 0; i < nodes_.size(); ++i) {
            for (size_t j = i + 1; j < nodes_.size(); ++j) {
                float dx = nodes_[j].x - nodes_[i].x;
                float dy = nodes_[j].y - nodes_[i].y;
                float distSq = dx * dx + dy * dy + 1.0f;
                float dist = std::sqrt(distSq);

                if (dist < 1000.0f) {
                    float force = repulsion / distSq;
                    float fx = (dx / dist) * force;
                    float fy = (dy / dist) * force;

                    if (!nodes_[i].fixed) {
                        nodes_[i].vx -= fx / nodes_[i].mass;
                        nodes_[i].vy -= fy / nodes_[i].mass;
                    }
                    if (!nodes_[j].fixed) {
                        nodes_[j].vx += fx / nodes_[j].mass;
                        nodes_[j].vy += fy / nodes_[j].mass;
                    }
                }
            }
        }

        // 2. Spring attraction along edges (Hooke's Law)
        for (const auto& edge : edges_) {
            auto itSrc = nodeIndexMap_.find(edge.source);
            auto itDst = nodeIndexMap_.find(edge.target);
            if (itSrc == nodeIndexMap_.end() || itDst == nodeIndexMap_.end()) continue;

            size_t i = itSrc->second;
            size_t j = itDst->second;

            float dx = nodes_[j].x - nodes_[i].x;
            float dy = nodes_[j].y - nodes_[i].y;
            float dist = std::max(1.0f, std::sqrt(dx * dx + dy * dy));
            float displacement = dist - edge.length;
            float force = displacement * edge.strength;

            float fx = (dx / dist) * force;
            float fy = (dy / dist) * force;

            if (!nodes_[i].fixed) {
                nodes_[i].vx += fx / nodes_[i].mass;
                nodes_[i].vy += fy / nodes_[i].mass;
            }
            if (!nodes_[j].fixed) {
                nodes_[j].vx -= fx / nodes_[j].mass;
                nodes_[j].vy -= fy / nodes_[j].mass;
            }
        }

        // 3. Position update and damping
        for (auto& node : nodes_) {
            if (!node.fixed) {
                node.x += node.vx;
                node.y += node.vy;
                node.vx *= damping;
                node.vy *= damping;
            }
        }
    }
}

void GraphLayoutEngine::computeHierarchical(float levelSpacing, float nodeSpacing) {
    if (nodes_.empty()) return;

    // Calculate in-degree for topological-like level assignment
    std::unordered_map<std::string, int> inDegree;
    std::unordered_map<std::string, std::vector<std::string>> adj;

    for (const auto& node : nodes_) {
        inDegree[node.id] = 0;
    }
    for (const auto& edge : edges_) {
        adj[edge.source].push_back(edge.target);
        inDegree[edge.target]++;
    }

    std::unordered_map<std::string, int> levels;
    std::queue<std::string> q;

    // Roots
    for (const auto& node : nodes_) {
        if (inDegree[node.id] == 0) {
            levels[node.id] = 0;
            q.push(node.id);
        }
    }

    // Fallback if cycles exist
    if (q.empty()) {
        levels[nodes_[0].id] = 0;
        q.push(nodes_[0].id);
    }

    while (!q.empty()) {
        std::string curr = q.front();
        q.pop();
        int currLevel = levels[curr];

        for (const auto& next : adj[curr]) {
            if (levels.find(next) == levels.end() || levels[next] < currLevel + 1) {
                levels[next] = currLevel + 1;
                q.push(next);
            }
        }
    }

    // Group nodes by level
    std::unordered_map<int, std::vector<std::string>> levelGroups;
    for (const auto& node : nodes_) {
        int lvl = levels.count(node.id) ? levels[node.id] : 0;
        levelGroups[lvl].push_back(node.id);
    }

    for (const auto& pair : levelGroups) {
        int lvl = pair.first;
        const auto& group = pair.second;
        float totalWidth = (group.size() - 1) * nodeSpacing;
        float startX = -totalWidth / 2.0f;

        for (size_t idx = 0; idx < group.size(); ++idx) {
            auto it = nodeIndexMap_.find(group[idx]);
            if (it != nodeIndexMap_.end()) {
                nodes_[it->second].x = startX + idx * nodeSpacing;
                nodes_[it->second].y = lvl * levelSpacing;
                nodes_[it->second].vx = 0.0f;
                nodes_[it->second].vy = 0.0f;
            }
        }
    }
}

} // namespace synapse
