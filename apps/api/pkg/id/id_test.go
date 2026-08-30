package id

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewID(t *testing.T) {
	id1 := NewID()
	id2 := NewID()
	assert.NotEmpty(t, id1)
	assert.NotEmpty(t, id2)
	assert.NotEqual(t, id1, id2)
}

func TestNewDisplayID(t *testing.T) {
	tests := []struct {
		nodeType string
		count    int
		expected string
	}{
		{"problem", 1, "P-001"},
		{"solution", 12, "S-012"},
		{"decision", 3, "D-003"},
		{"feature", 7, "F-007"},
		{"component", 100, "C-100"},
		{"risk", 2, "R-002"},
		{"test", 5, "T-005"},
		{"benchmark", 9, "B-009"},
		{"note", 4, "N-004"},
		{"lesson", 6, "L-006"},
		{"link", 8, "K-008"},
		{"deployment", 11, "Y-011"},
		{"log", 15, "G-015"},
		{"unknown", 1, "N-001"},
	}

	for _, tt := range tests {
		t.Run(tt.nodeType, func(t *testing.T) {
			res := NewDisplayID(tt.nodeType, tt.count)
			assert.Equal(t, tt.expected, res)
		})
	}
}

func TestCursorEncodeDecode(t *testing.T) {
	now := time.Now().Truncate(time.Nanosecond)
	uid := NewID()

	encoded := EncodeCursor(now, uid)
	require.NotEmpty(t, encoded)

	decodedTime, decodedID, err := DecodeCursor(encoded)
	require.NoError(t, err)
	assert.Equal(t, uid, decodedID)
	assert.Equal(t, now.UnixNano(), decodedTime.UnixNano())
}

func BenchmarkDisplayID(b *testing.B) {
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = NewDisplayID("feature", i)
	}
}

func BenchmarkCursorEncodeDecode(b *testing.B) {
	now := time.Now()
	uid := "123e4567-e89b-12d3-a456-426614174000"
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		enc := EncodeCursor(now, uid)
		_, _, _ = DecodeCursor(enc)
	}
}
