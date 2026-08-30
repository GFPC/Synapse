#pragma once

#include <vector>
#include <string>
#include <memory>
#include <algorithm>

namespace synapse {

struct Rect {
    float x;      // Center X
    float y;      // Center Y
    float width;  // Half width
    float height; // Half height

    bool contains(float px, float py) const {
        return (px >= x - width && px <= x + width &&
                py >= y - height && py <= y + height);
    }

    bool intersects(const Rect& other) const {
        return !(other.x - other.width > x + width ||
                 other.x + other.width < x - width ||
                 other.y - other.height > y + height ||
                 other.y + other.height < y - height);
    }
};

struct SpatialNode {
    std::string id;
    float x;
    float y;
    float width;
    float height;
};

class QuadTree {
public:
    static const size_t CAPACITY = 8;
    static const size_t MAX_DEPTH = 8;

    QuadTree(Rect boundary, size_t depth = 0);
    ~QuadTree() = default;

    bool insert(const SpatialNode& node);
    void clear();
    void query(const Rect& range, std::vector<std::string>& visibleNodeIds) const;
    size_t size() const;

private:
    void subdivide();

    Rect boundary_;
    size_t depth_;
    bool divided_ = false;
    std::vector<SpatialNode> nodes_;

    std::unique_ptr<QuadTree> nw_;
    std::unique_ptr<QuadTree> ne_;
    std::unique_ptr<QuadTree> sw_;
    std::unique_ptr<QuadTree> se_;
};

} // namespace synapse
