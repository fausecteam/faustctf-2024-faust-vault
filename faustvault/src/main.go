package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	kvs "faust.ninja/faustvault/kvs"
)

var kvStore *kvs.KVStore

func main() {
	store, err := kvs.New()
	kvStore = store
	if err != nil {
		log.Printf("Failed to create KVStore: %v", err)
		return;
	}
	
	http.HandleFunc("/", handleStore)
	fmt.Println("Server is listening on port 8080...")
	http.ListenAndServe(":8080", nil)
}

func handleStore(w http.ResponseWriter, r *http.Request) {
	fmt.Println(r.URL.Path)
	parts := strings.Split(r.URL.Path, "/")

	if len(parts) == 2 {
		handleGetAllMasters(w, r)
		return
	}

	if len(parts) != 3 {
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprintf(w, "Invalid request path\n")
		return
	}

	group := parts[1]
	key := parts[2]

	if key == "" {
		if r.Method == http.MethodPost {
			handlePost(w, r, group)
		} else if r.Method == http.MethodGet {
			handleGetAll(w, r, group)
		} else {
			w.WriteHeader(http.StatusMethodNotAllowed)
			fmt.Fprintf(w, "Method %s not allowed\n", r.Method)
		}
		return
	}

	switch r.Method {
	case http.MethodGet:
		handleGet(w, r, group, key)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
		fmt.Fprintf(w, "Method %s not allowed\n", r.Method)
	}
}

func handlePost(w http.ResponseWriter, r *http.Request, group string) {
	var kv kvs.KeyValue
	err := json.NewDecoder(r.Body).Decode(&kv)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprintf(w, "Invalid format\n")
		return
	}

	err = kvStore.Set(group, kv.Key, kv.Value)
	if err != nil {
		log.Printf("Failed to set value: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Failed to set value\n")
		return
	}
	json.NewEncoder(w).Encode(kv)
}

func handleGetAll(w http.ResponseWriter, r *http.Request, group string) {
	values, err := kvStore.GetAll(group)
	if err != nil {
		log.Printf("Failed to get value: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Failed to get value\n")
		return
	}
	if values == nil {
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprintf(w, "%s not found\n", group)
		return
	}
	json.NewEncoder(w).Encode(values)
}

func handleGetAllMasters(w http.ResponseWriter, r *http.Request) {
	values, err := kvStore.GetAllKeys("master-key")
	if err != nil {
		log.Printf("Failed to get value: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Failed to get value\n")
		return
	}
	if values == nil {
		json.NewEncoder(w).Encode([]kvs.KeyValue{})
		return
	} 
	json.NewEncoder(w).Encode(values)
}

func handleGet(w http.ResponseWriter, r *http.Request, group string, key string) {
	value, found, err := kvStore.Get(group, key)
	if err != nil {
		log.Printf("Failed to set value: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Failed to set value\n")
	}
	if !found {
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprintf(w, "'%s/%s' not found\n", group, key)
		return
	}
	kv := kvs.KeyValue{
		Key:   key,
		Value: value,
	}
	json.NewEncoder(w).Encode(kv)
}
