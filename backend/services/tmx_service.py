
import os
import uuid
import time
import asyncio
import xml.etree.ElementTree as ET
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
import json
from datetime import datetime

# TMX namespace
NS = {'tmx': 'http://www.lisa.org/tmx14'}

class TMXService:
    """Service for handling Translation Memory eXchange (TMX) files"""
    
    def __init__(self):
        self.tmx_dir = os.getenv("TMX_DIRECTORY", "./tmx_files")
        self.translation_units = {}
        self.index_path = os.path.join(self.tmx_dir, "tmx_index.json")
        
        # Create directories
        Path(self.tmx_dir).mkdir(parents=True, exist_ok=True)
        
        # Load existing index
        self._load_index()
    
    def _load_index(self) -> None:
        """Load TMX index from disk"""
        if os.path.exists(self.index_path):
            try:
                with open(self.index_path, 'r', encoding='utf-8') as f:
                    self.translation_units = json.load(f)
            except Exception as e:
                print(f"Error loading TMX index: {e}")
                self.translation_units = {}
    
    def _save_index(self) -> None:
        """Save TMX index to disk"""
        try:
            with open(self.index_path, 'w', encoding='utf-8') as f:
                json.dump(self.translation_units, f, indent=2)
        except Exception as e:
            print(f"Error saving TMX index: {e}")
    
    async def parse_tmx_file(self, file_path: str) -> Dict[str, Any]:
        """
        Parse a TMX file and extract translation units
        
        Args:
            file_path: Path to the TMX file
            
        Returns:
            Summary of parsed content
        """
        try:
            tree = ET.parse(file_path)
            root = tree.getroot()
            
            # Extract header information
            header = root.find('./tmx:header', NS)
            header_info = {}
            
            if header is not None:
                for attr, value in header.attrib.items():
                    header_info[attr] = value
            
            # Extract translation units
            translation_units = root.findall('.//tmx:tu', NS)
            parsed_units = []
            new_count = 0
            updated_count = 0
            
            for tu in translation_units:
                # Extract properties and variants
                tu_id = tu.get('tuid', str(uuid.uuid4()))
                
                # Get all translation variants
                variants = {}
                for tuv in tu.findall('./tmx:tuv', NS):
                    lang = tuv.get('{http://www.w3.org/XML/1998/namespace}lang', '')
                    seg = tuv.find('./tmx:seg', NS)
                    if seg is not None and seg.text:
                        variants[lang] = seg.text
                
                if variants:
                    # Check if this unit exists in our index
                    if tu_id in self.translation_units:
                        # Update existing unit
                        self.translation_units[tu_id]["variants"].update(variants)
                        self.translation_units[tu_id]["last_updated"] = datetime.now().isoformat()
                        updated_count += 1
                    else:
                        # Add new unit
                        self.translation_units[tu_id] = {
                            "id": tu_id,
                            "variants": variants,
                            "metadata": {attr: tu.get(attr) for attr in tu.attrib},
                            "created_at": datetime.now().isoformat(),
                            "last_updated": datetime.now().isoformat()
                        }
                        new_count += 1
                    
                    parsed_units.append({
                        "id": tu_id,
                        "variants": variants
                    })
            
            # Save updated index
            self._save_index()
            
            return {
                "filename": os.path.basename(file_path),
                "header": header_info,
                "units_parsed": len(parsed_units),
                "units_new": new_count,
                "units_updated": updated_count,
                "total_units_in_memory": len(self.translation_units)
            }
            
        except Exception as e:
            print(f"Error parsing TMX file: {e}")
            raise ValueError(f"Failed to parse TMX file: {str(e)}")
    
    async def create_tmx_file(self, translations: List[Dict[str, Any]], source_lang: str, target_lang: str) -> str:
        """
        Create a TMX file from translation data
        
        Args:
            translations: List of translation pairs
            source_lang: Source language code
            target_lang: Target language code
            
        Returns:
            Path to the created TMX file
        """
        # Create TMX structure
        root = ET.Element('tmx', {'version': '1.4'})
        ET.register_namespace('', 'http://www.lisa.org/tmx14')
        
        header = ET.SubElement(root, 'header', {
            'creationtool': 'LangChain Translation Service',
            'creationtoolversion': '1.0',
            'datatype': 'plaintext',
            'segtype': 'sentence',
            'adminlang': 'en',
            'srclang': source_lang,
            'o-tmf': 'plain'
        })
        
        body = ET.SubElement(root, 'body')
        
        # Add translation units
        for translation in translations:
            source_text = translation.get('source_text', '')
            target_text = translation.get('target_text', '')
            
            if not source_text or not target_text:
                continue
                
            # Create translation unit
            tu = ET.SubElement(body, 'tu')
            
            # Source language variant
            tuv_source = ET.SubElement(tu, 'tuv', {'{http://www.w3.org/XML/1998/namespace}lang': source_lang})
            seg_source = ET.SubElement(tuv_source, 'seg')
            seg_source.text = source_text
            
            # Target language variant
            tuv_target = ET.SubElement(tu, 'tuv', {'{http://www.w3.org/XML/1998/namespace}lang': target_lang})
            seg_target = ET.SubElement(tuv_target, 'seg')
            seg_target.text = target_text
            
            # Also save to our index
            tu_id = str(uuid.uuid4())
            self.translation_units[tu_id] = {
                "id": tu_id,
                "variants": {
                    source_lang: source_text,
                    target_lang: target_text
                },
                "metadata": {},
                "created_at": datetime.now().isoformat(),
                "last_updated": datetime.now().isoformat()
            }
        
        # Save TMX file
        output_filename = f"translation_{source_lang}_to_{target_lang}_{int(time.time())}.tmx"
        output_path = os.path.join(self.tmx_dir, output_filename)
        
        tree = ET.ElementTree(root)
        tree.write(output_path, encoding='utf-8', xml_declaration=True)
        
        # Save updated index
        self._save_index()
        
        return output_path
    
    async def search_translation_memory(self, text: str, source_lang: str, target_lang: str, threshold: float = 0.7) -> List[Dict[str, Any]]:
        """
        Search translation memory for similar segments
        
        Args:
            text: Text to find translations for
            source_lang: Source language code
            target_lang: Target language code
            threshold: Similarity threshold (0-1)
            
        Returns:
            List of matching translation units
        """
        from sentence_transformers import SentenceTransformer, util
        
        # Load embedding model - this should be cached for production use
        try:
            model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
            
            # Embed the query text
            query_embedding = model.encode(text, convert_to_tensor=True)
            
            # Find relevant units that have both source and target languages
            relevant_units = []
            for unit_id, unit in self.translation_units.items():
                variants = unit.get('variants', {})
                if source_lang in variants and target_lang in variants:
                    relevant_units.append(unit)
            
            if not relevant_units:
                return []
                
            # Calculate similarities
            source_texts = [unit['variants'][source_lang] for unit in relevant_units]
            source_embeddings = model.encode(source_texts, convert_to_tensor=True)
            
            # Calculate cosine similarities
            cos_scores = util.cos_sim(query_embedding, source_embeddings)[0]
            
            # Create matching pairs with similarity scores
            matches = []
            for i, score in enumerate(cos_scores):
                if score >= threshold:
                    matches.append({
                        "source_text": relevant_units[i]['variants'][source_lang],
                        "target_text": relevant_units[i]['variants'][target_lang],
                        "similarity": float(score),
                        "unit_id": relevant_units[i]['id']
                    })
            
            # Sort by similarity (highest first)
            matches.sort(key=lambda x: x['similarity'], reverse=True)
            
            return matches
            
        except Exception as e:
            print(f"Error searching translation memory: {e}")
            return []
