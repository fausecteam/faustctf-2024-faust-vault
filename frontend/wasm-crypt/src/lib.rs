use wasm_bindgen::prelude::*;
use rand::prelude::*;
use rand_chacha::ChaCha8Rng;
use aes::cipher::{block_padding::Pkcs7, BlockDecryptMut, BlockEncryptMut, KeyIvInit};

const NUMBER_OF_BITS_AES: usize = 192;
const NUMBER_OF_BYTES_AES: usize = NUMBER_OF_BITS_AES / 8;

#[wasm_bindgen]
pub fn generate_master_key(input: Box<[JsValue]>) -> Box<[u8]> {
    if !input[0].is_string() || !input[1].is_string() || input.len() != 2 {
        return Box::new([0u8; 1]);
    }

    let username = input[0].as_string().unwrap();
    let password = input[1].as_string().unwrap();

    let hash_seed: u64 = cityhasher::hash(format!("{username}{password}"));
    Box::new(generate_aes_key(hash_seed))
}


#[wasm_bindgen]
pub fn encrypt_text(text: Box<[u8]>, master_key: Box<[u8]>) -> Box<[u8]> {
    encrypt_aes(&text, &master_key).into_boxed_slice()
}

#[wasm_bindgen]
pub fn decrypt_text(text: Box<[u8]>, master_key: Box<[u8]>) -> Box<[u8]> {
    decrypt_aes(&text, &master_key).into_boxed_slice()
}

fn decrypt_aes(cipher_text: &[u8], key: &[u8]) -> Vec<u8> {
    let iv = [0x42; 16];
    type Aes192CbcDec = cbc::Decryptor<aes::Aes192>;
    
    Aes192CbcDec::new(key.into(), &iv.into())
                        .decrypt_padded_vec_mut::<Pkcs7>(cipher_text).unwrap()
}

fn encrypt_aes(plain_text: &[u8], key: &[u8]) -> Vec<u8> {
    let iv = [0x42; 16];
    type Aes192CbcEnc = cbc::Encryptor<aes::Aes192>;
    
    Aes192CbcEnc::new(key.into(), &iv.into())
                        .encrypt_padded_vec_mut::<Pkcs7>(&plain_text)
}

fn generate_aes_key(seed: u64) -> [u8; NUMBER_OF_BYTES_AES] {
    let mut rng: ChaCha8Rng = ChaCha8Rng::seed_from_u64(seed);
    let mut aes_key_bytes : [u8; NUMBER_OF_BYTES_AES] = [0;NUMBER_OF_BYTES_AES];

    for byte in 0..NUMBER_OF_BYTES_AES {
        aes_key_bytes[byte] = rng.gen::<u8>();
    }
    aes_key_bytes
}