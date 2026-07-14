import unittest
from app.services import reconstruction_service

class TestReconstructionService(unittest.TestCase):
    def setUp(self):
        # Create a mock RDOM document model
        self.mock_rdom = {
            "pages": [
                {
                    "page_num": 0,
                    "width": 612.0,
                    "height": 792.0,
                    "blocks": [
                        {
                            "id": "p0_b0",
                            "page_num": 0,
                            "bbox": [54.0, 54.0, 354.0, 74.0],
                            "text": "Experienced Software Engineer working on python code.",
                            "font_family": "Calibri",
                            "font_size": 10.0,
                            "font_weight": "normal",
                            "font_color": "#000000",
                            "alignment": "left",
                            "line_height": 1.2,
                            "section_type": "summary",
                            "confidence_score": 1.0,
                            "lines": []
                        },
                        {
                            "id": "p0_b1",
                            "page_num": 0,
                            "bbox": [54.0, 100.0, 354.0, 120.0],
                            "text": "Designed high scale database endpoints.",
                            "font_family": "Arial-Bold",
                            "font_size": 10.0,
                            "font_weight": "bold",
                            "font_color": "#111111",
                            "alignment": "left",
                            "line_height": 1.2,
                            "section_type": "experience",
                            "confidence_score": 1.0,
                            "lines": []
                        }
                    ]
                }
            ],
            "metadata": {"format": "pdf"}
        }

    def test_rebuild_and_reflow_shifting(self):
        # Block 0 text is replaced with a much longer sentence that will wrap into multiple lines
        longer_text = (
            "Successfully spearheaded design, development, and scaling of resilient distributed APIs "
            "handling over 15,000 requests per second. Reduced response latency metrics by 28% utilizing "
            "optimized Python backend caches, asynchronous FastAPI workers, and PostgreSQL indexes."
        )
        
        approved_changes = {
            "p0_b0": longer_text
        }
        
        # Rebuild layout
        rebuilt = reconstruction_service.rebuild_rdom(self.mock_rdom, approved_changes)
        
        page = rebuilt["pages"][0]
        block_0 = page["blocks"][0]
        block_1 = page["blocks"][1]
        
        # Verify block 0 text is updated
        self.assertEqual(block_0["text"], longer_text)
        
        # Calculate new height
        h0_new = block_0["bbox"][3] - block_0["bbox"][1]
        # Bbox top remains the same
        self.assertEqual(block_0["bbox"][1], 54.0)
        # Bbox height should increase from original 20.0
        self.assertTrue(h0_new > 20.0)
        
        # Verify block 1 has shifted downward (y0 should be original 100.0 + dy)
        dy = h0_new - 20.0 # height change
        self.assertAlmostEqual(block_1["bbox"][1], 100.0 + dy, places=2)
        
    def test_pdf_rendering(self):
        # Verify ReportLab canvas compiles the PDF bytes successfully
        pdf_bytes = reconstruction_service.render_rdom_to_pdf_bytes(self.mock_rdom)
        
        self.assertIsNotNone(pdf_bytes)
        self.assertTrue(len(pdf_bytes) > 0)
        # Check PDF header signature
        self.assertEqual(pdf_bytes[:4], b"%PDF")
        
    def test_validation_engine(self):
        validation = reconstruction_service.validate_reconstructed_rdom(self.mock_rdom)
        self.assertTrue(validation["is_valid"])
        self.assertEqual(len(validation["overlaps"]), 0)

if __name__ == '__main__':
    unittest.main()
