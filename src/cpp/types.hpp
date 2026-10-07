// Modified from KineNest (Apache-2.0). Generic wire helpers; types come from registry.
#pragma once
#include <memory>
#include <functional>
#include <vector>
#include <map>
#include <string>
#include <chrono>
#include <cstdio>
#include <cstdlib>
#include <cstdarg>
#include <type_traits>
#include <cmath>
#include <array>
#include <cstdint>
#include <limits>
#include <codecvt>
#include <locale>

extern "C" {
__attribute__((import_module("kinenest"),import_name("service_available"))) int kn_service_available(const char*,int);
__attribute__((import_module("kinenest"),import_name("emit"))) void kn_emit(const char*,int);
__attribute__((import_module("kinenest"),import_name("spin"))) void kn_spin();
__attribute__((import_module("kinenest"),import_name("range_access"))) void kn_range_access(int);
__attribute__((import_module("kinenest"),import_name("image_access"))) void kn_image_access(int,int);
__attribute__((import_module("kinenest"),import_name("fail"))) void kn_fail(const char*,int);
__attribute__((import_module("kinenest"),import_name("field_length"))) int kn_field_length(const char*,int);
__attribute__((import_module("kinenest"),import_name("field_kind"))) int kn_field_kind(const char*,int);
__attribute__((import_module("kinenest"),import_name("field_bool"))) int kn_field_bool(const char*,int);
__attribute__((import_module("kinenest"),import_name("field_number"))) double kn_field_number(const char*,int);
__attribute__((import_module("kinenest"),import_name("field_string_size"))) int kn_field_string_size(const char*,int);
__attribute__((import_module("kinenest"),import_name("field_string_copy"))) int kn_field_string_copy(const char*,int,char*,int);
}
namespace kinenest {
inline std::string quote(const std::string& s){std::string out="\"";for(unsigned char c:s){if(c=='"'||c=='\\'){out+='\\';out+=c;}else if(c<32){char b[7];std::snprintf(b,7,"\\u%04x",c);out+=b;}else out+=c;}return out+'"';}
inline void emit(const std::string& s){kn_emit(s.data(),static_cast<int>(s.size()));}
inline int next_id=0;
inline void fail(const std::string& text){kn_fail(text.data(),static_cast<int>(text.size()));}
inline std::string number(double value,const char* field="Value"){
 if(!std::isfinite(value))fail(std::string(field)+" must be a finite number");
 char text[32];std::snprintf(text,sizeof(text),"%.17g",value);return text;
}
inline bool field_bool(const std::string& path){return kn_field_bool(path.data(),path.size())!=0;}
inline double field_number(const std::string& path){return kn_field_number(path.data(),path.size());}
inline std::string field_string(const std::string& path){
 const int size=kn_field_string_size(path.data(),path.size());
 std::string value(size,'\0');if(size)kn_field_string_copy(path.data(),path.size(),&value[0],size);return value;
}

template<class T> struct MessageTraits;
template<class T> T read(const std::string& p){
 if constexpr(std::is_same<T,std::string>::value)return field_string(p);
 else if constexpr(std::is_same<T,std::wstring>::value)return std::wstring_convert<std::codecvt_utf8<wchar_t>>().from_bytes(field_string(p));
 else if constexpr(std::is_same<T,bool>::value)return field_bool(p);
 else if constexpr(std::is_arithmetic<T>::value)return static_cast<T>(field_number(p));
 else return MessageTraits<T>::decode(p+".");
}
template<class T> std::string encode_value(const T& v){
 if constexpr(std::is_same<T,std::string>::value)return quote(v);
 else if constexpr(std::is_same<T,std::wstring>::value)return quote(std::wstring_convert<std::codecvt_utf8<wchar_t>>().to_bytes(v));
 else if constexpr(std::is_same<T,bool>::value)return v?"true":"false";
 else if constexpr(std::is_arithmetic<T>::value)return number(v);
 else return MessageTraits<T>::encode(v);
}
template<class T> std::string encode_value(const std::vector<T>& v){std::string s="[";for(size_t i=0;i<v.size();i++){if(i)s+=",";s+=encode_value(v[i]);}return s+"]";}
template<class T,size_t N> std::string encode_value(const std::array<T,N>& v){std::string s="[";for(size_t i=0;i<N;i++){if(i)s+=",";s+=encode_value(v[i]);}return s+"]";}
inline std::map<int,std::function<void()>> subscriptions,timers,service_responses;
inline std::map<int,std::function<void(const std::string&)>> service_handlers;
}
