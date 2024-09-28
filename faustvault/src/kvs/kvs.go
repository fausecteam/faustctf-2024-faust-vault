package kvs

import (
	"context"
	"fmt"
	"os"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type KeyValue struct {
	Key   	string `json:"key"`
	Value 	string `json:"value"`
}

type KeyEntry struct {
	Group		string	`json:"group"`
	CreatedAt	int64	`json:"createdAt"`
}

type KVStore struct {
	dbConn *pgxpool.Pool
}

func New() (*KVStore, error) {
	conn, err := pgxpool.New(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		return nil, fmt.Errorf("unable to connect to database: %v", err)
	}

	return &KVStore {
		dbConn: conn,
	}, nil
}

func (k *KVStore) Set(group, key, value string) error {
	_, err := k.dbConn.Exec(context.Background(),
		"INSERT INTO kv_store (\"group\", key, value) VALUES ($1, $2, $3)",
		group, key, value)
	if err != nil {
		return fmt.Errorf("unable to set value: %v", err)
	}
	return nil
}

func (k *KVStore) Get(group, key string) (string, bool, error) {
	var value string
	err := k.dbConn.QueryRow(context.Background(), 
		"SELECT value FROM kv_store WHERE \"group\"=$1 AND key=$2", 
		group, key).Scan(&value)
	if err != nil {
		if err == pgx.ErrNoRows {
			return "", false, nil
		}
		return "", false, fmt.Errorf("unable to get value: %v", err)
	}
	return value, true, nil
}

func (k *KVStore) GetAll(group string) ([]KeyValue, error) {
	rows, err := k.dbConn.Query(context.Background(), 
		"SELECT key, value FROM kv_store WHERE \"group\"=$1", group)
	if err != nil {
		return nil, fmt.Errorf("unable to retrieve values: %v", err)
	}
	defer rows.Close()

	// Initialize a slice to store the key-value pairs
	var result []KeyValue

	// Iterate over the rows and populate the slice
	for rows.Next() {
		var kv KeyValue
		if err := rows.Scan(&kv.Key, &kv.Value); err != nil {
			return nil, fmt.Errorf("failed to scan row: %v", err)
		}
		result = append(result, kv)
	}

	// Check for errors after the iteration
	if rows.Err() != nil {
		return nil, fmt.Errorf("row iteration failed: %v", rows.Err())
	}

	return result, nil
}

func (k *KVStore) GetAllKeys(key string) ([]KeyEntry, error) {
	rows, err := k.dbConn.Query(context.Background(),
		`SELECT "group", EXTRACT(EPOCH FROM created_at)::BIGINT AS created_at
		FROM kv_store
		WHERE key = $1
		AND created_at >= NOW() - INTERVAL '20 minutes'`, key)
	if err != nil {
		return nil, fmt.Errorf("unable to retrieve groups: %v", err)
	}
	defer rows.Close()

	var result []KeyEntry

	for rows.Next() {
		var entry KeyEntry
		if err := rows.Scan(&entry.Group, &entry.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan row: %v", err)
		}
		result = append(result, entry)
	}

	if rows.Err() != nil {
		return nil, fmt.Errorf("row iteration failed: %v", rows.Err())
	}

	return result, nil
}
