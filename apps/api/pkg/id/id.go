package id

import (
	"encoding/base64"
	"fmt"
	"github.com/google/uuid"
	"strings"
	"time"
)

func NewID() string {
	return uuid.New().String()
}

func NewDisplayID(nodeType string, count int) string {
	prefix := "N"
	switch nodeType {
	case "problem": prefix = "P"
	case "solution": prefix = "S"
	case "decision": prefix = "D"
	case "feature": prefix = "F"
	case "component": prefix = "C"
	case "risk": prefix = "R"
	case "test": prefix = "T"
	case "benchmark": prefix = "B"
	case "note": prefix = "N"
	case "lesson": prefix = "L"
	case "link": prefix = "K"
	case "deployment": prefix = "Y"
	case "log": prefix = "G"
	}
	return fmt.Sprintf("%s-%03d", prefix, count)
}

func EncodeCursor(t time.Time, id string) string {
	s := fmt.Sprintf("%d,%s", t.UnixNano(), id)
	return base64.RawURLEncoding.EncodeToString([]byte(s))
}

func DecodeCursor(s string) (time.Time, string, error) {
	b, err := base64.RawURLEncoding.DecodeString(s)
	if err != nil {
		return time.Time{}, "", err
	}
	parts := strings.Split(string(b), ",")
	if len(parts) != 2 {
		return time.Time{}, "", fmt.Errorf("invalid cursor")
	}
	var ts int64
	fmt.Sscanf(parts[0], "%d", &ts)
	return time.Unix(0, ts), parts[1], nil
}
