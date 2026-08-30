#include "QuadTree.hpp"

namespace synapse {

QuadTree::QuadTree(Rect boundary, size_t depth)
    : boundary_(boundary), depth_(depth) {
    nodes_.reserve(CAPACITY);
}

void QuadTree::clear() {
    nodes_.clear();
    divided_ = false;
    nw_.reset();
    ne_.reset();
    sw_.reset();
    se_.reset();
}

void QuadTree::subdivide() {
    float hw = boundary_.width / 2.0f;
    float hh = boundary_.height / 2.0f;
    float x = boundary_.x;
    float y = boundary_.y;

    nw_ = std::make_unique<QuadTree>(Rect{x - hw, y - hh, hw, hh}, depth_ + 1);
    ne_ = std::make_unique<QuadTree>(Rect{x + hw, y - hh, hw, hh}, depth_ + 1);
    sw_ = std::make_unique<QuadTree>(Rect{x - hw, y + hh, hw, hh}, depth_ + 1);
    se_ = std::make_unique<QuadTree>(Rect{x + hw, y + hh, hw, hh}, depth_ + 1);

    divided_ = true;

    // Distribute existing nodes
    auto oldNodes = std::move(nodes_);
    nodes_.clear();
    for (const auto& node : oldNodes) {
        insert(node);
    }
}

bool QuadTree::insert(const SpatialNode& node) {
    if (!boundary_.contains(node.x, node.y)) {
        return false;
    }

    if (!divided_) {
        if (nodes_.size() < CAPACITY || depth_ >= MAX_DEPTH) {
            nodes_.push_back(node);
            return true;
        }
        subdivide();
    }

    if (nw_->insert(node)) return true;
    if (ne_->insert(node)) return true;
    if (sw_->insert(node)) return true;
    if (se_->insert(node)) return true;

    // Fallback if boundary borders
    nodes_.push_back(node);
    return true;
}

void QuadTree::query(const Rect& range, std::vector<std::string>& visibleNodeIds) const {
    if (!boundary_.intersects(range)) {
        return;
    }

    for (const auto& node : nodes_) {
        Rect nodeBounds{node.x, node.y, node.width / 2.0f, node.height / 2.0f};
        if (range.intersects(nodeBounds)) {
            visibleNodeIds.push_back(node.id);
        }
    }

    if (divided_) {
        nw_->query(range, visibleNodeIds);
        ne_->query(range, visibleNodeIds);
        sw_->query(range, visibleNodeIds);
        se_->query(range, visibleNodeIds);
    }
}

size_t QuadTree::size() const {
    size_t count = nodes_.size();
    if (divided_) {
        count += nw_->size() + ne_->size() + sw_->size() + se_->size();
    }
    return count;
}

} // namespace synapse
